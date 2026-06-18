/**
 * Simple In-Memory / File-based Database Mock.
 * Used as a fallback when local MongoDB is not running, ensuring
 * TradeSphere remains fully functional out-of-the-box.
 */

const crypto = require('crypto');

// In-memory collections
const store = {
  users: [],
  stocks: [],
  transactions: [],
  portfolios: []
};

// Helper for chainable queries
const makeChainable = (data) => {
  const promise = Promise.resolve(data);
  
  promise.select = () => makeChainable(data);
  promise.populate = () => makeChainable(data);
  promise.sort = (sortObj) => {
    if (!sortObj || !Array.isArray(data)) return makeChainable(data);
    const key = Object.keys(sortObj)[0];
    const desc = sortObj[key] === -1;
    const sorted = [...data].sort((a, b) => {
      let valA = a[key];
      let valB = b[key];
      // Handle nested population if needed, otherwise compare directly
      if (valA < valB) return desc ? 1 : -1;
      if (valA > valB) return desc ? -1 : 1;
      return 0;
    });
    return makeChainable(sorted);
  };
  promise.limit = (num) => {
    if (Array.isArray(data)) {
      return makeChainable(data.slice(0, num));
    }
    return makeChainable(data);
  };
  
  return promise;
};

class MockModel {
  constructor(collectionName) {
    this.coll = collectionName;
  }

  get data() {
    return store[this.coll];
  }

  set data(val) {
    store[this.coll] = val;
  }

  find(query = {}) {
    let results = this.data;
    
    // Simple filter matching
    if (Object.keys(query).length > 0) {
      results = results.filter(item => {
        for (let key in query) {
          // Handle regex search
          if (query[key] && query[key].$regex) {
            const regex = new RegExp(query[key].$regex, query[key].$options || '');
            if (!regex.test(item[key])) return false;
          } else if (query[key] && typeof query[key] === 'object' && query[key].$or) {
            // Simple $or logic
            return query[key].$or.some(subQuery => {
              const subKey = Object.keys(subQuery)[0];
              return item[subKey] === subQuery[subKey];
            });
          } else if (key === '$or') {
            return query[key].some(subQuery => {
              const subKey = Object.keys(subQuery)[0];
              if (subQuery[subKey] && subQuery[subKey].$regex) {
                const regex = new RegExp(subQuery[subKey].$regex, subQuery[subKey].$options || '');
                return regex.test(item[subKey]);
              }
              return item[subKey] === subQuery[subKey];
            });
          } else {
            // Standard direct match
            if (item[key] !== query[key]) return false;
          }
        }
        return true;
      });
    }
    
    return makeChainable(results);
  }

  findOne(query = {}) {
    return this.find(query).then(list => {
      const doc = list[0] || null;
      return doc ? this._wrapDoc(doc) : null;
    });
  }

  findById(id) {
    const strId = id ? id.toString() : '';
    const item = this.data.find(x => x._id.toString() === strId);
    return Promise.resolve(item ? this._wrapDoc(item) : null);
  }

  async findOneAndDelete(query = {}) {
    const item = await this.findOne(query);
    if (item) {
      this.data = this.data.filter(x => x._id.toString() !== item._id.toString());
    }
    return item;
  }

  async findByIdAndDelete(id) {
    return this.findOneAndDelete({ _id: id });
  }

  async create(obj) {
    // Array creation support
    if (Array.isArray(obj)) {
      const created = obj.map(x => this._createSingle(x));
      return created;
    }
    return this._createSingle(obj);
  }

  async insertMany(arr) {
    return this.create(arr);
  }

  async deleteMany(query = {}) {
    if (Object.keys(query).length === 0) {
      this.data = [];
    } else {
      const itemsToDelete = await this.find(query);
      const ids = itemsToDelete.map(x => x._id.toString());
      this.data = this.data.filter(x => !ids.includes(x._id.toString()));
    }
    return { deletedCount: this.data.length };
  }

  _createSingle(obj) {
    const doc = {
      _id: crypto.randomBytes(12).toString('hex'),
      createdAt: new Date(),
      ...obj
    };
    
    // Add comparison password helper for User Mock
    if (this.coll === 'users') {
      const bcrypt = require('bcryptjs');
      // Hash password if not already hashed (bcrypt hashes start with $2a$ or $2b$)
      if (doc.password && !doc.password.startsWith('$2a$') && !doc.password.startsWith('$2b$')) {
        const salt = bcrypt.genSaltSync(10);
        doc.password = bcrypt.hashSync(doc.password, salt);
      }
      doc.matchPassword = async function(enteredPassword) {
        return await bcrypt.compare(enteredPassword, this.password);
      };
    }

    this.data.push(doc);
    return this._wrapDoc(doc);
  }

  _wrapDoc(doc) {
    if (!doc) return null;
    const modelInstance = this;
    
    // Support save()
    doc.save = async function() {
      // Find item in collection and update it
      const index = modelInstance.data.findIndex(x => x._id.toString() === doc._id.toString());
      if (index > -1) {
        modelInstance.data[index] = { ...doc };
      }
      return doc;
    };
    
    doc.toObject = function() { return doc; };
    return doc;
  }
}

// Instantiate mock models
const MockUser = new MockModel('users');
const MockStock = new MockModel('stocks');
const MockTransaction = new MockModel('transactions');
const MockPortfolio = new MockModel('portfolios');

module.exports = {
  store,
  User: MockUser,
  Stock: MockStock,
  Transaction: MockTransaction,
  Portfolio: MockPortfolio
};
