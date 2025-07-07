const axios = require('axios');

class ZaicoService {
  constructor() {
    this.apiToken = process.env.ZAICO_API_TOKEN;
    this.baseURL = 'https://web.zaico.co.jp/api/v1';
    this.axiosInstance = axios.create({
      baseURL: this.baseURL,
      headers: {
        'Authorization': `Bearer ${this.apiToken}`,
        'Content-Type': 'application/json'
      }
    });
  }

  async getAllInventories() {
    try {
      let allInventories = [];
      let nextUrl = '/inventories';

      while (nextUrl) {
        const response = await this.axiosInstance.get(nextUrl);
        
        if (response.data && response.data.inventories) {
          allInventories = [...allInventories, ...response.data.inventories];
        }

        const linkHeader = response.headers.link;
        nextUrl = this.getNextPageUrl(linkHeader);
      }

      return allInventories;
    } catch (error) {
      console.error('Error fetching Zaico inventories:', error.message);
      throw new Error('Failed to fetch data from Zaico API');
    }
  }

  getNextPageUrl(linkHeader) {
    if (!linkHeader) return null;

    const links = linkHeader.split(',');
    for (const link of links) {
      const [url, rel] = link.split(';');
      if (rel && rel.includes('rel="next"')) {
        const match = url.match(/<(.+)>/);
        if (match) {
          return match[1].replace(this.baseURL, '');
        }
      }
    }
    return null;
  }
}

module.exports = new ZaicoService();