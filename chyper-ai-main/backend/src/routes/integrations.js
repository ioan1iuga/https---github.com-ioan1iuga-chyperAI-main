import express from 'express';
import CloudflareService from '../services/cloudflare/CloudflareService.js';
import GitHubService from '../services/github/GitHubService.js';

const router = express.Router();

// Cloudflare integration
router.get('/cloudflare/workers', async (req, res) => {
  try {
    const workers = await CloudflareService.getWorkers();
    res.json(workers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/cloudflare/workers', async (req, res) => {
  try {
    const worker = await CloudflareService.deployWorker(req.body);
    res.json(worker);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/cloudflare/dns', async (req, res) => {
  try {
    const records = await CloudflareService.getDNSRecords();
    res.json(records);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GitHub integration
router.get('/github/repos', async (req, res) => {
  try {
    const repos = await GitHubService.getRepositories();
    res.json(repos);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/github/repos/:owner/:repo/deploy', async (req, res) => {
  try {
    const deployment = await GitHubService.triggerDeployment(
      req.params.owner,
      req.params.repo,
      req.body
    );
    res.json(deployment);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Docker integration
router.get('/docker/containers', async (req, res) => {
  try {
    // Docker container management logic
    res.json({ containers: [] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;