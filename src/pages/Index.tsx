
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Download, Github, Loader2, FileText, Zap, Key } from 'lucide-react';
import { toast } from "@/hooks/use-toast";

const Index = () => {
  const [repoUrl, setRepoUrl] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedDockerfile, setGeneratedDockerfile] = useState('');
  const [repoInfo, setRepoInfo] = useState<{name: string, language: string} | null>(null);

  const validateGithubUrl = (url: string) => {
    const githubPattern = /^https:\/\/github\.com\/[\w-]+\/[\w-]+\/?$/;
    return githubPattern.test(url.trim());
  };

  const extractRepoInfo = (url: string) => {
    const match = url.match(/github\.com\/([^\/]+)\/([^\/]+)/);
    if (match) {
      return {
        owner: match[1],
        repo: match[2].replace(/\.git$/, '')
      };
    }
    return null;
  };

  const fetchRepoInfo = async (owner: string, repo: string) => {
    try {
      const response = await fetch(`https://api.github.com/repos/${owner}/${repo}`);
      if (!response.ok) throw new Error('Repository not found');
      
      const data = await response.json();
      return {
        name: data.full_name,
        language: data.language || 'Unknown',
        description: data.description || ''
      };
    } catch (error) {
      console.error('Error fetching repo info:', error);
      return null;
    }
  };

  const generateDockerfileWithAI = async (repoInfo: any) => {
    if (!apiKey.trim()) {
      throw new Error('OpenRouter API key is required');
    }

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
        'HTTP-Referer': window.location.origin,
        'X-Title': 'AI Dockerfile Generator'
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
    return data.choices[0]?.message?.content || '';
  };

  const generateDockerfile = async () => {
    if (!validateGithubUrl(repoUrl)) {
      toast({
        title: "Invalid GitHub URL",
        description: "Please enter a valid GitHub repository URL",
        variant: "destructive"
      });
      return;
    }

    if (!apiKey.trim()) {
      toast({
        title: "API Key Required",
        description: "Please enter your OpenRouter API key",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);
    
    try {
      const repoInfo = extractRepoInfo(repoUrl);
      if (!repoInfo) throw new Error('Could not parse repository info');

      // Fetch actual repository information from GitHub API
      const fetchedRepoInfo = await fetchRepoInfo(repoInfo.owner, repoInfo.repo);
      if (!fetchedRepoInfo) {
        throw new Error('Repository not found or is private');
      }

      setRepoInfo(fetchedRepoInfo);

      // Generate Dockerfile using OpenRouter AI
      const dockerfile = await generateDockerfileWithAI(fetchedRepoInfo);
      
      if (!dockerfile.trim()) {
        throw new Error('Failed to generate Dockerfile content');
      }

      setGeneratedDockerfile(dockerfile.trim());
      
      toast({
        title: "Dockerfile Generated!",
        description: `Successfully generated Dockerfile for ${fetchedRepoInfo.language} project`,
      });
      
    } catch (error) {
      console.error('Generation error:', error);
      toast({
        title: "Generation Failed",
        description: error instanceof Error ? error.message : "Failed to generate Dockerfile. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadDockerfile = () => {
    if (!generatedDockerfile) return;
    
    const blob = new Blob([generatedDockerfile], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Dockerfile';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Download Started",
      description: "Dockerfile has been downloaded successfully",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-6">
            <div className="relative">
              <div className="absolute inset-0 bg-blue-500 rounded-full blur-xl opacity-20 animate-pulse"></div>
              <div className="relative bg-gradient-to-r from-blue-500 to-purple-600 p-4 rounded-full">
                <FileText className="w-8 h-8 text-white" />
              </div>
            </div>
          </div>
          
          <h1 className="text-5xl font-bold text-white mb-4 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            AI Dockerfile Generator
          </h1>
          <p className="text-xl text-slate-300 max-w-2xl mx-auto">
            Transform any GitHub repository into a production-ready Docker container with AI-powered analysis
          </p>
        </div>

        {/* Main Content */}
        <div className="max-w-4xl mx-auto">
          {/* API Key Section */}
          <Card className="mb-8 bg-slate-800/50 border-slate-700 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Key className="w-5 h-5" />
                OpenRouter API Key
              </CardTitle>
              <CardDescription className="text-slate-400">
                Enter your OpenRouter API key to generate AI-powered Dockerfiles. Get one at{' '}
                <a href="https://openrouter.ai" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">
                  openrouter.ai
                </a>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Input
                type="password"
                placeholder="sk-or-v1-..."
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="bg-slate-700 border-slate-600 text-white placeholder-slate-400 focus:border-blue-500"
              />
            </CardContent>
          </Card>

          {/* Input Section */}
          <Card className="mb-8 bg-slate-800/50 border-slate-700 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Github className="w-5 h-5" />
                Repository URL
              </CardTitle>
              <CardDescription className="text-slate-400">
                Enter the GitHub repository URL to generate a customized Dockerfile
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                <div className="flex-1">
                  <Input
                    type="url"
                    placeholder="https://github.com/username/repository"
                    value={repoUrl}
                    onChange={(e) => setRepoUrl(e.target.value)}
                    className="bg-slate-700 border-slate-600 text-white placeholder-slate-400 focus:border-blue-500"
                  />
                </div>
                <Button 
                  onClick={generateDockerfile}
                  disabled={isGenerating || !repoUrl.trim() || !apiKey.trim()}
                  className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-8"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4 mr-2" />
                      Generate
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Repository Info */}
          {repoInfo && (
            <Card className="mb-8 bg-slate-800/50 border-slate-700 backdrop-blur-sm">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Github className="w-5 h-5 text-slate-400" />
                    <span className="text-white font-medium">{repoInfo.name}</span>
                  </div>
                  <Badge variant="secondary" className="bg-blue-500/20 text-blue-300 border-blue-500/30">
                    {repoInfo.language}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Generated Dockerfile */}
          {generatedDockerfile && (
            <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-white flex items-center gap-2">
                      <FileText className="w-5 h-5" />
                      Generated Dockerfile
                    </CardTitle>
                    <CardDescription className="text-slate-400">
                      Production-ready Dockerfile optimized for your repository
                    </CardDescription>
                  </div>
                  <Button
                    onClick={downloadDockerfile}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="relative">
                  <Textarea
                    value={generatedDockerfile}
                    readOnly
                    className="font-mono text-sm bg-slate-900 border-slate-600 text-slate-200 min-h-[400px] resize-none"
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Features Section */}
          {!generatedDockerfile && (
            <div className="grid md:grid-cols-3 gap-6 mt-12">
              <Card className="bg-slate-800/30 border-slate-700 backdrop-blur-sm">
                <CardContent className="pt-6 text-center">
                  <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <Zap className="w-6 h-6 text-blue-400" />
                  </div>
                  <h3 className="text-white font-semibold mb-2">AI-Powered Analysis</h3>
                  <p className="text-slate-400 text-sm">
                    Automatically detects your project's technology stack and dependencies
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-slate-800/30 border-slate-700 backdrop-blur-sm">
                <CardContent className="pt-6 text-center">
                  <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <FileText className="w-6 h-6 text-purple-400" />
                  </div>
                  <h3 className="text-white font-semibold mb-2">Production Ready</h3>
                  <p className="text-slate-400 text-sm">
                    Generates optimized Dockerfiles with best practices and security features
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-slate-800/30 border-slate-700 backdrop-blur-sm">
                <CardContent className="pt-6 text-center">
                  <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <Download className="w-6 h-6 text-green-400" />
                  </div>
                  <h3 className="text-white font-semibold mb-2">Instant Download</h3>
                  <p className="text-slate-400 text-sm">
                    Download your customized Dockerfile and start containerizing immediately
                  </p>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Index;
