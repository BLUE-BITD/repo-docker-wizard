
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Download, Github, Loader2, FileText, Zap } from 'lucide-react';
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

      // Simulate AI analysis and Dockerfile generation
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Mock analysis of repository (in real app, this would call GitHub API)
      const mockLanguage = ['JavaScript', 'TypeScript', 'Python', 'Java', 'Go'][Math.floor(Math.random() * 5)];
      
      setRepoInfo({
        name: `${repoInfo.owner}/${repoInfo.repo}`,
        language: mockLanguage
      });

      // Generate Dockerfile based on detected language
      const dockerfileTemplates = {
        'JavaScript': `# Node.js Dockerfile for ${repoInfo.repo}
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \\
  CMD curl -f http://localhost:3000/health || exit 1

# Start the application
CMD ["npm", "start"]`,

        'TypeScript': `# TypeScript Node.js Dockerfile for ${repoInfo.repo}
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install all dependencies (including dev dependencies for build)
RUN npm ci

# Copy source code
COPY . .

# Build the TypeScript application
RUN npm run build

# Production stage
FROM node:18-alpine AS production

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy built application from builder stage
COPY --from=builder /app/dist ./dist

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

USER nextjs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \\
  CMD curl -f http://localhost:3000/health || exit 1

# Start the application
CMD ["node", "dist/index.js"]`,

        'Python': `# Python Dockerfile for ${repoInfo.repo}
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \\
    gcc \\
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for better caching
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy source code
COPY . .

# Create non-root user
RUN useradd --create-home --shell /bin/bash app
USER app

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \\
  CMD curl -f http://localhost:8000/health || exit 1

# Start the application
CMD ["python", "app.py"]`,

        'Java': `# Java Dockerfile for ${repoInfo.repo}
FROM openjdk:17-jdk-slim AS builder

WORKDIR /app

# Copy Maven files
COPY pom.xml ./
COPY mvnw ./
COPY .mvn ./.mvn

# Download dependencies
RUN ./mvnw dependency:go-offline

# Copy source code
COPY src ./src

# Build the application
RUN ./mvnw clean package -DskipTests

# Production stage
FROM openjdk:17-jre-slim

WORKDIR /app

# Copy JAR from builder stage
COPY --from=builder /app/target/*.jar app.jar

# Create non-root user
RUN addgroup --system javauser && adduser --system --group javauser
USER javauser

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \\
  CMD curl -f http://localhost:8080/actuator/health || exit 1

# Start the application
CMD ["java", "-jar", "app.jar"]`,

        'Go': `# Go Dockerfile for ${repoInfo.repo}
FROM golang:1.21-alpine AS builder

WORKDIR /app

# Copy go mod files
COPY go.mod go.sum ./

# Download dependencies
RUN go mod download

# Copy source code
COPY . .

# Build the application
RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o main .

# Production stage
FROM alpine:latest

RUN apk --no-cache add ca-certificates

WORKDIR /root/

# Copy binary from builder stage
COPY --from=builder /app/main .

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \\
  CMD wget --no-verbose --tries=1 --spider http://localhost:8080/health || exit 1

# Start the application
CMD ["./main"]`
      };

      const dockerfile = dockerfileTemplates[mockLanguage as keyof typeof dockerfileTemplates] || dockerfileTemplates['JavaScript'];
      setGeneratedDockerfile(dockerfile);
      
      toast({
        title: "Dockerfile Generated!",
        description: `Successfully generated Dockerfile for ${mockLanguage} project`,
      });
      
    } catch (error) {
      toast({
        title: "Generation Failed",
        description: "Failed to generate Dockerfile. Please try again.",
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
                  disabled={isGenerating || !repoUrl.trim()}
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
