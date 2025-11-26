import NodeCache from 'node-cache';

// Cache with 5-minute TTL
const cache = new NodeCache({ stdTTL: 300 });

export default cache;