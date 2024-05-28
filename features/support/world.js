const { setWorldConstructor } = require('@cucumber/cucumber');

class CustomWorld {
  constructor() {
    const port = process.env.PORT || 3000; 
    this.api = `http://localhost:${port}`;
    this.response = null;
  }
}

setWorldConstructor(CustomWorld);