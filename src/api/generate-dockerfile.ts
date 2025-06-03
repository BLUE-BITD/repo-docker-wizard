
export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { repoInfo } = req.body;

  if (!repoInfo) {
    return res.status(400).json({ error: 'Repository information is required' });
  }

  // Use environment variable for API key (hidden from frontend)
  const apiKey = process.env.OPENROUTER_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: 'API key not configured' });
  }

  try {
    const prompt = `Generate a production-ready Dockerfile for a ${repoInfo.language} project named "${repoInfo.name}". 
    
Project details:
- Language: ${repoInfo.language}
- Description: ${repoInfo.description}

Requirements:
- Use multi-stage builds when appropriate
- Include security best practices
- Add health checks
- Optimize for production
- Include comments explaining each step
- Use appropriate base images
- Set up proper user permissions
- Include environment variables where needed

Generate ONLY the Dockerfile content, no additional text or explanations.`;

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
        'X-Title': 'DockerGen - AI Dockerfile Generator'
      },
      body: JSON.stringify({
        model: 'meta-llama/llama-3.1-8b-instruct:free',
        messages: [
          {
            role: 'system',
            content: 'You are an expert DevOps engineer specializing in Docker containerization. Generate production-ready Dockerfiles with best practices.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 2000
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'Failed to generate Dockerfile');
    }

    const data = await response.json();
    const dockerfile = data.choices[0]?.message?.content || '';

    return res.status(200).json({ dockerfile });
  } catch (error) {
    console.error('Dockerfile generation error:', error);
    return res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Failed to generate Dockerfile' 
    });
  }
}
