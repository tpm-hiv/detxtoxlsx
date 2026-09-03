// Netlify serverless function to proxy TMDB API requests
// This keeps the API key secure on the server side

// The browser may only ask for searches. Without this the function is an open
// proxy: anyone could point it at any TMDB endpoint and spend our rate limit.
const ALLOWED_ENDPOINTS = ['search/multi', 'search/tv', 'search/movie'];

exports.handler = async (event) => {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  const apiKey = process.env.TMDB_API_KEY;

  if (!apiKey) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'TMDB API key not configured' })
    };
  }

  try {
    const { endpoint, params } = JSON.parse(event.body || '{}');

    if (!endpoint) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing endpoint parameter' })
      };
    }

    if (!ALLOWED_ENDPOINTS.includes(endpoint)) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Endpoint not allowed' })
      };
    }

    // Build the TMDB API URL
    const separator = params ? '&' : '';
    const url = `https://api.themoviedb.org/3/${endpoint}?api_key=${apiKey}${separator}${params || ''}`;

    const response = await fetch(url);
    const data = await response.json();

    return {
      statusCode: response.status,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify(data)
    };
  } catch (error) {
    console.error('TMDB API error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'API request failed', details: error.message })
    };
  }
};
