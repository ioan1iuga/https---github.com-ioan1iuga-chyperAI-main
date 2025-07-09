class CloudflareService {
  constructor() {
    this.apiToken = process.env.CLOUDFLARE_API_TOKEN;
    this.accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
    this.baseUrl = 'https://api.cloudflare.com/client/v4';
  }

  async getWorkers() {
    try {
      const response = await fetch(`${this.baseUrl}/accounts/${this.accountId}/workers/scripts`, {
        headers: {
          'Authorization': `Bearer ${this.apiToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Cloudflare API error: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching Cloudflare Workers:', error);
      return { result: [], success: false, errors: [error.message] };
    }
  }

  async deployWorker(workerData) {
    try {
      const { name, script, metadata } = workerData;
      
      const response = await fetch(`${this.baseUrl}/accounts/${this.accountId}/workers/scripts/${name}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${this.apiToken}`,
          'Content-Type': 'application/javascript'
        },
        body: script
      });
      
      if (!response.ok) {
        throw new Error(`Failed to deploy worker: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error deploying Cloudflare Worker:', error);
      throw error;
    }
  }

  async getDNSRecords(zoneId) {
    try {
      const response = await fetch(`${this.baseUrl}/zones/${zoneId}/dns_records`, {
        headers: {
          'Authorization': `Bearer ${this.apiToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch DNS records: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching DNS records:', error);
      return { result: [], success: false, errors: [error.message] };
    }
  }

  async getZones() {
    try {
      const response = await fetch(`${this.baseUrl}/zones`, {
        headers: {
          'Authorization': `Bearer ${this.apiToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch zones: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching zones:', error);
      return { result: [], success: false, errors: [error.message] };
    }
  }
}

export default new CloudflareService();