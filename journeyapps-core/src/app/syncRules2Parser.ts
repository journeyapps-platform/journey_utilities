import * as xml from '@journeyapps/core-xml';
import { PrettyData } from './prettyData';
import { ObjectType } from '@journeyapps/parser-schema';
import { XMLElement, XMLAttribute, XMLDocument } from '@journeyapps/domparser/types';

// The parser here is mainly for validation, but could also be used for visualization (may need to be extended).

export function Parser(base: any) {
  this.base = base;
  this.schema = base.schema;
  this.userModel = base.userModel;

  this.buckets = base.buckets;
  this.globalBuckets = base.globalBuckets;
  this.syncAllBuckets = base.syncAllBuckets;
}

Parser.prototype.pushErrors = function (errors: any[]) {
  this.base.pushErrors(errors);
};

Parser.prototype.pushError = function (element: xml.XMLPositional, message: string, type: xml.ErrorType) {
  this.base.pushError(element, message, type);
};

Parser.prototype.parseDocument = function (document: XMLDocument) {
  const root = document.documentElement;

  if (root.tagName != 'sync') {
    this.pushError(root, '<sync> root tag expected');
    // fatal error
    return {
      errors: this.errors
    };
  }
  const parsedRoot = xml.parseElement(root, {
    sync: {
      version: xml.attribute.notBlank,
      _required: ['version']
    }
  });
  this.pushErrors(parsedRoot.errors);
  if (parsedRoot.attributes.version != null && parsedRoot.attributes.version !== '2') {
    this.pushError(root, 'version must be "2"', 'error');
  }

  this.pushErrors(
    xml.validateChildren(root, {
      bucket: 1,
      'global-bucket': 1
    })
  );

  xml.children(root, 'bucket').forEach((element) => {
    this.parseBucket(element);
  });

  xml.children(root, 'global-bucket').forEach((element) => {
    this.parseGlobalBucket(element);
  });
};

/**
 * Parses a via parameter, and returns the referenced model.
 *
 * @param via {string} - path spec.
 * @return the model referenced by the via, or null if it cannot be determined
 */
Parser.prototype.parseVia = function (via: string, node: XMLAttribute) {
  if (via == null) {
    return null;
  }

  const components = via.split('/');

  let current = this.userModel;
  if (current == null) {
    this.pushError(node, 'Unknown user type');
    return;
  }

  for (let i = 0; i < components.length; i++) {
    const component = components[i];
    const match = /^(\w+)(\[(.+)\])?$/.exec(component);
    if (!match) {
      this.pushError(node, 'Invalid: ' + component, 'error');
      return;
    }
    const relName = match[1];
    let condition = match[3];

    if (i == 0 && relName == 'self') {
      continue;
    }

    let next;
    if (relName in current.hasMany) {
      next = current.hasMany[relName].objectType;
    } else if (relName in current.belongsTo) {
      next = current.belongsTo[relName].foreignType;
    } else {
      this.pushError(node, `'${component}' is not defined`, 'error');
      return;
    }

    condition = this.validateCondition(condition, next, node);
    current = next;
  }

  return current;
};

Parser.prototype.validateCondition = function (condition: any, model: ObjectType, node: xml.XMLPositional) {
  return this.base.validateCondition(condition, model, node);
};

Parser.prototype.parseBucket = function (element: XMLElement) {
  const parsedBucket = xml.parseElement(element, {
    bucket: {
      via: xml.attribute.notBlank,
      _required: ['via']
    }
  });

  this.pushErrors(parsedBucket.errors);

  // Only <has-many> children allowed
  this.pushErrors(
    xml.validateChildren(element, {
      'has-many': 1
    })
  );

  const rootModel = this.parseVia(parsedBucket.attributes.via, xml.attributeNode(element, 'via'));

  let bucket = {
    root: rootModel,
    via: parsedBucket.attributes.via,
    children: [] as any[]
  };

  this.buckets.push(bucket);

  xml.children(element, 'has-many').forEach((childElement) => {
    const parsedRelationship = xml.parseElement(childElement, {
      'has-many': {
        name: xml.attribute.notBlank,
        condition: xml.attribute.notBlank,
        _required: ['name']
      }
    });
    this.pushErrors(parsedRelationship.errors);
    // Validate no children
    this.pushErrors(xml.validateChildren(childElement, {}));

    const name = parsedRelationship.attributes.name;
    let condition = parsedRelationship.attributes.condition;

    if (rootModel && name) {
      const rel = rootModel.hasMany[name];
      if (rel == null) {
        this.pushError(xml.attributeNode(childElement, 'name'), "'" + name + "' is not defined");
        return;
      }

      const model = rel.objectType;
      condition = this.validateCondition(condition, model, xml.attributeNode(childElement, 'condition'));

      bucket.children.push({
        name,
        model,
        condition
      });
    }
  });
};

Parser.prototype.parseGlobalBucket = function (element: XMLElement) {
  let parsedBucket = xml.parseElement(element, {
    'global-bucket': {
      via: xml.attribute.notBlank,
      _required: []
    }
  });

  this.pushErrors(parsedBucket.errors);

  // Only <all-models> and <model> children allowed
  this.pushErrors(
    xml.validateChildren(element, {
      model: 1,
      'all-models': 1
    })
  );

  this.parseVia(parsedBucket.attributes.via, xml.attributeNode(element, 'via'));

  let bucket = {
    via: parsedBucket.attributes.via,
    children: [] as any[]
  };

  let modelCount = 0;

  xml.children(element, 'model').forEach((childElement) => {
    modelCount += 1;
    const parsedModel = xml.parseElement(childElement, {
      model: {
        name: xml.attribute.notBlank,
        condition: xml.attribute.notBlank,
        _required: ['name']
      }
    });
    this.pushErrors(parsedModel.errors);
    // Validate no children
    this.pushErrors(xml.validateChildren(childElement, {}));

    const name = parsedModel.attributes.name;
    let condition = parsedModel.attributes.condition;

    if (name) {
      const model = this.schema.objects[name];
      if (model == null) {
        this.pushError(xml.attributeNode(childElement, 'name'), "'" + name + "' is not defined");
      } else {
        condition = this.validateCondition(condition, model, xml.attributeNode(childElement, 'condition'));
      }

      bucket.children.push({
        name,
        model,
        condition
      });
    }
  });

  let allModels = 0;
  let syncAll = false;

  xml.children(element, 'all-models').forEach((childElement) => {
    const parsedModel = xml.parseElement(childElement, {
      'all-models': {}
    });
    this.pushErrors(parsedModel.errors);

    // Validate no children
    this.pushErrors(xml.validateChildren(childElement, {}));

    allModels += 1;
    if (allModels > 1 || modelCount > 0) {
      this.pushError(childElement, 'Only a single <all-models /> is allowed inside <global-bucket>');
    } else {
      syncAll = true;
    }
  });

  if (syncAll) {
    this.syncAllBuckets.push(bucket);
  } else {
    this.globalBuckets.push(bucket);
  }
};

export function Serializer(syncRules: any) {
  this.syncRules = syncRules;
}

Serializer.prototype.toText = function () {
  let doc = xml.createDocument('sync');
  let root = doc.documentElement;
  root.setAttribute('version', '2');

  this.syncRules.syncAllBuckets.forEach((bucket: any) => {
    let bucketElement = doc.createElement('global-bucket');
    if (bucket.via != null) {
      bucketElement.setAttribute('via', bucket.via);
    }

    let childElement = doc.createElement('all-models');
    bucketElement.appendChild(childElement);
    root.appendChild(bucketElement);
  });

  this.syncRules.buckets.forEach((bucket: any) => {
    let bucketElement = doc.createElement('bucket');
    bucketElement.setAttribute('via', bucket.via);

    bucket.children.forEach((child: any) => {
      let childElement = doc.createElement('has-many');
      childElement.setAttribute('name', child.name);
      if (child.condition != null) {
        childElement.setAttribute('condition', child.condition);
      }
      bucketElement.appendChild(childElement);
    });

    root.appendChild(bucketElement);
  });

  this.syncRules.globalBuckets.forEach((bucket: any) => {
    let bucketElement = doc.createElement('global-bucket');
    if (bucket.via != null) {
      bucketElement.setAttribute('via', bucket.via);
    }

    bucket.children.forEach((child: any) => {
      let childElement = doc.createElement('model');
      childElement.setAttribute('name', child.name);
      if (child.condition != null) {
        childElement.setAttribute('condition', child.condition);
      }
      bucketElement.appendChild(childElement);
    });

    root.appendChild(bucketElement);
  });

  let xmlString = xml.documentToText(doc);
  return new PrettyData().xml(xmlString);
};
