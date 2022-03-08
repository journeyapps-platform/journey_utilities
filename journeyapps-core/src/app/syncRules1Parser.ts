import * as xml from '@journeyapps/core-xml';
import { ObjectType } from '@journeyapps/parser-schema';
import { XMLDocument, XMLElement } from '@journeyapps/domparser/types';

// This parser is for two purposes:
//  1. Validation (linting)
//  2. Migration to sync rules v2.
// The bucket representation returned here does not match the one on our backend.

export function Parser(base: any) {
  this.base = base;
  this.schema = base.schema;

  this.buckets = base.buckets;
  this.globalBuckets = base.globalBuckets;
  this.syncAllBuckets = base.syncAllBuckets;
}

Parser.prototype.pushErrors = function (errors: any[]) {
  this.base.pushErrors(errors);
};

Parser.prototype.pushError = function (element: xml.XMLPositional, message: string, type: string) {
  this.base.pushError(element, message, type);
};

Parser.prototype.validateCondition = function (condition: string, model: ObjectType, node: xml.XMLPositional) {
  return this.base.validateCondition(condition, model, node);
};

Parser.prototype.parseDocument = function (document: XMLDocument) {
  const root = document.documentElement;

  this.pushErrors(
    xml.validateChildren(root, {
      user: 1
    })
  );

  const users = xml.children(root, 'user');

  users.forEach((user) => {
    this.parseUser(user);
  });

  if (this.buckets.length == 0 && this.globalBuckets.length == 0) {
    // Special case - sync everything
    this.syncAllBuckets.push({ via: null });
  }
};

Parser.prototype.parseUser = function (user: XMLElement) {
  const self = this;

  const parsedUser = xml.parseElement(user, {
    user: {
      type: xml.attribute.notBlank,
      condition: xml.attribute.notBlank,
      _required: ['type']
    }
  });

  this.pushErrors(parsedUser.errors);
  const userTypeName = parsedUser.attributes.type;
  let userCondition = parsedUser.attributes.condition;
  const userType: ObjectType = this.schema.objects[userTypeName];
  if (userTypeName != null && userType == null) {
    this.pushError(xml.attributeNode(user, 'type'), "'" + userTypeName + "' is not defined");
  }
  if (userType) {
    this.validateCondition(userCondition, userType, xml.attributeNode(user, 'condition'));
  }

  this.pushErrors(
    xml.validateChildren(user, {
      relationship: 1,
      object: 1
    })
  );

  let globalBucket = {
    via: null as string,
    children: [] as any[]
  };

  let root: string;

  if (userCondition) {
    root = `self[${userCondition}]`;
    globalBucket.via = root;
  } else {
    root = 'self';
  }

  const globals = xml.children(user, 'object');
  globals.forEach((g) => {
    const parsedGlobal = xml.parseElement(g, {
      object: {
        type: xml.attribute.notBlank,
        condition: xml.attribute.notBlank
      }
    });
    self.pushErrors(parsedGlobal.errors);

    let typeName = parsedGlobal.attributes.type;
    let globalType = this.schema.objects[typeName];
    let globalCondition = parsedGlobal.attributes.condition;
    if (typeName != null && globalType == null) {
      self.pushError(xml.attributeNode(g, 'type'), "'" + typeName + "' is not defined");
    }

    if (globalType) {
      globalCondition = this.validateCondition(globalCondition, globalType, xml.attributeNode(g, 'condition'));
    }

    // No children
    self.pushErrors(xml.validateChildren(g, {}));

    globalBucket.children.push({
      name: typeName,
      model: globalType,
      condition: globalCondition
    });
  });

  if (globalBucket.children.length > 0) {
    this.globalBuckets.push(globalBucket);
  }

  let userBucket = {
    via: root,
    children: [] as any[]
  };

  this.buckets.push(userBucket);

  const relationships = xml.children(user, 'relationship');
  relationships.forEach((relationship) => {
    const parsedRelationship = xml.parseElement(relationship, {
      relationship: {
        has_many: xml.attribute.notBlank,
        belongs_to: xml.attribute.notBlank,
        condition: xml.attribute.notBlank
      }
    });
    self.pushErrors(parsedRelationship.errors);

    let relCondition = parsedRelationship.attributes.condition;

    const hasMany = parsedRelationship.attributes.has_many;
    let nestedType = null as any;
    if (userType && hasMany) {
      const rel = userType.hasMany[hasMany];
      if (rel == null) {
        self.pushError(xml.attributeNode(relationship, 'has_many'), "'" + hasMany + "' is not defined");
      } else {
        nestedType = rel.objectType;
      }
    }

    const belongsTo = parsedRelationship.attributes.belongs_to;
    if (userType && belongsTo) {
      const belongsToRel = userType.belongsTo[belongsTo];
      if (belongsToRel == null) {
        self.pushError(xml.attributeNode(relationship, 'belongs_to'), "'" + belongsTo + "' is not defined");
      } else {
        nestedType = belongsToRel.foreignType;
      }
    }

    self.pushErrors(
      xml.validateChildren(relationship, {
        relationship: 1
      })
    );

    if (nestedType) {
      relCondition = this.validateCondition(relCondition, nestedType, xml.attributeNode(relationship, 'condition'));
    }

    let relName = belongsTo || hasMany;
    let via = `${root}/${relName}`;
    if (relCondition) {
      via += `[${relCondition}]`;
    }

    let bucket = {
      via: via,
      children: [] as any[]
    };

    let onRoot = hasMany && !belongsTo;

    xml.children(relationship, 'relationship').forEach((nested) => {
      onRoot = false;
      const parsedNested = xml.parseElement(nested, {
        relationship: {
          has_many: xml.attribute.notBlank,
          condition: xml.attribute.notBlank,
          _required: ['has_many']
        }
      });
      self.pushErrors(parsedNested.errors);

      let nestedCondition = parsedNested.attributes.condition;
      let nestedMany = parsedNested.attributes.has_many;
      let subNestedType;

      if (nestedType && nestedMany) {
        const nestedRel = nestedType.hasMany[nestedMany];
        if (nestedRel == null) {
          self.pushError(xml.attributeNode(nested, 'has_many'), "'" + nestedMany + "' is not defined");
        } else {
          subNestedType = nestedRel.objectType;
        }

        bucket.children.push({
          name: nestedMany,
          model: subNestedType,
          condition: nestedCondition
        });

        if (subNestedType) {
          nestedCondition = this.validateCondition(
            nestedCondition,
            subNestedType,
            xml.attributeNode(nested, 'condition')
          );
        }
      }

      // No children
      self.pushErrors(xml.validateChildren(nested, {}));
    });

    if (onRoot) {
      userBucket.children.push({
        name: hasMany,
        condition: parsedRelationship.attributes.condition
      });
    } else {
      this.buckets.push(bucket);
    }
  });
};

module.exports = {
  Parser: Parser
};
