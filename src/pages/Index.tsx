
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Download, Github, Loader2, FileText, Zap, Sparkles } from 'lucide-react';
import { toast } from "@/hooks/use-toast";

const Index = () => {
  const [repoUrl, setRepoUrl] = useState('');
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

  const generateDockerfile = async () => {
    if (!validateGithubUrl(repoUrl)) {
      toast({
        title: "Invalid GitHub URL",
        description: "Please enter a valid GitHub repository URL",
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

      // Call our backend API endpoint instead of directly calling OpenRouter
      const response = await fetch('/api/generate-dockerfile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          repoInfo: fetchedRepoInfo
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate Dockerfile');
      }

      const data = await response.json();
      const dockerfile = data.dockerfile;
      
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
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-100">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl font-semibold text-gray-900">DockerGen</h1>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-200">
                AI-Powered
              </Badge>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-4xl text-center">
          <div className="flex items-center justify-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
          </div>
          
          <h1 className="text-5xl font-bold text-gray-900 mb-6 leading-tight">
            Generate Production-Ready
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"> Dockerfiles</span>
          </h1>
          
          <p className="text-xl text-gray-600 mb-12 max-w-2xl mx-auto">
            Transform any GitHub repository into a containerized application with AI-powered Dockerfile generation in seconds.
          </p>

          {/* Input Section */}
          <div className="max-w-2xl mx-auto mb-12">
            <Card className="border-0 shadow-lg">
              <CardContent className="p-8">
                <div className="flex gap-4">
                  <div className="flex-1">
                    <Input
                      type="url"
                      placeholder="https://github.com/username/repository"
                      value={repoUrl}
                      onChange={(e) => setRepoUrl(e.target.value)}
                      className="h-12 text-lg border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                  <Button 
                    onClick={generateDockerfile}
                    disabled={isGenerating || !repoUrl.trim()}
                    className="h-12 px-8 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white"
                    size="lg"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Zap className="w-5 h-5 mr-2" />
                        Generate
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Repository Info */}
          {repoInfo && (
            <div className="max-w-2xl mx-auto mb-8">
              <Card className="border-gray-200">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Github className="w-5 h-5 text-gray-500" />
                      <span className="font-medium text-gray-900">{repoInfo.name}</span>
                    </div>
                    <Badge variant="outline" className="border-blue-200 text-blue-700">
                      {repoInfo.language}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Generated Dockerfile */}
          {generatedDockerfile && (
            <div className="max-w-4xl mx-auto">
              <Card className="border-gray-200 text-left">
                <CardHeader className="border-b border-gray-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center space-x-2">
                        <FileText className="w-5 h-5" />
                        <span>Generated Dockerfile</span>
                      </CardTitle>
                      <CardDescription className="mt-1">
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
                <CardContent className="p-0">
                  <Textarea
                    value={generatedDockerfile}
                    readOnly
                    className="font-mono text-sm border-0 resize-none rounded-none min-h-[400px] focus:ring-0"
                  />
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </section>

      {/* Features Section */}
      {!generatedDockerfile && (
        <section className="py-20 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Why Choose DockerGen?</h2>
              <p className="text-xl text-gray-600">Built for developers who value efficiency and best practices</p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Zap className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">AI-Powered Analysis</h3>
                <p className="text-gray-600">
                  Automatically detects your project's technology stack and dependencies for optimal containerization
                </p>
              </div>

              <div className="text-center">
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <FileText className="w-6 h-6 text-purple-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Production Ready</h3>
                <p className="text-gray-600">
                  Generates optimized Dockerfiles with security best practices, multi-stage builds, and health checks
                </p>
              </div>

              <div className="text-center">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Download className="w-6 h-6 text-green-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Instant Download</h3>
                <p className="text-gray-600">
                  Download your customized Dockerfile immediately and start containerizing your applications
                </p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="border-t border-gray-100 py-12">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <div className="w-6 h-6 bg-blue-600 rounded-lg flex items-center justify-center">
              <FileText className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold text-gray-900">DockerGen</span>
          </div>
          <p className="text-gray-600">AI-powered Dockerfile generation for modern development workflows</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
