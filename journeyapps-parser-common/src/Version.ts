/**
 * Version-related functions
 */
export class Version {
  major: number;
  minor: number;
  hasPatch: boolean;
  patch: number;
  v3: boolean;
  v3_1: boolean; // tslint:disable-line
  v2: boolean;

  constructor(str: string) {
    var components = str.split('.');
    this.major = parseInt(components[0], 10);
    this.minor = parseInt(components[1], 10);
    this.hasPatch = components.length >= 3;
    if (this.hasPatch) {
      this.patch = parseInt(components[2], 10);
    } else {
      this.patch = null;
    }

    this.v3 = this.major >= 3;
    this.v3_1 = (this.v3 && this.minor >= 1) || this.major > 3;
    this.v2 = this.major < 3;
  }

  toString() {
    if (this.patch != null) {
      return this.major + '.' + this.minor + '.' + this.patch;
    } else {
      return this.major + '.' + this.minor;
    }
  }

  valueOf() {
    return this.toString();
  }

  // Returns -1 if < other, 0 if equal, 1 if > other.
  compareTo(other: Version) {
    var thisPatch = this.patch == null ? -1 : this.patch;
    var otherPatch = other.patch == null ? -1 : other.patch;
    if (this.major < other.major) {
      return -1;
    } else if (this.major > other.major) {
      return 1;
    } else if (this.minor < other.minor) {
      return -1;
    } else if (this.minor > other.minor) {
      return 1;
    } else if (thisPatch < otherPatch) {
      return -1;
    } else if (thisPatch > otherPatch) {
      return 1;
    } else {
      return 0;
    }
  }

  supportsApi(api: string | Version) {
    return api != null && this.gte(api) && ver(api).gte('2.0');
  }

  gte(other: string | Version) {
    const otherVersion = ver(other);
    return this.compareTo(otherVersion) >= 0;
  }
}

function ver(v: string | Version) {
  if (typeof v == 'string') {
    v = new Version(v);
  }
  return v;
}

export const DEFAULT = new Version('2.5');
