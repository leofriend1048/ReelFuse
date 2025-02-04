"use client"
import { useState } from 'react';
import { generateAdScriptJSON, generateAdInsights } from '@/lib/googlecloud';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface AdInsights {
  success_factors: {
    factor1: string;
    factor2: string;
    factor3: string;
    factor4: string;
    factor5: string;
  };
  areas_for_improvement: {
    area1: string;
    area2: string;
    area3: string;
    area4: string;
    area5: string;
  };
}

interface AdScript {
  FrameworkModule: {
    Module: string;
    DescriptionOfVisuals: string;
    VoiceoverCopy: string;
  }[];
}

const AdScriptGenerator = () => {
  const [videoUrl, setVideoUrl] = useState('');
  const [adScript, setAdScript] = useState<AdScript | null>(null);
  const [adInsights, setAdInsights] = useState<AdInsights | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedTab, setSelectedTab] = useState('Table');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!videoUrl) {
      setError('Please enter a video URL.');
      return;
    }

    setLoading(true);
    setError('');
    setAdScript(null);
    setAdInsights(null);

    try {
      const [scriptResponse, insightsResponse] = await Promise.all([
        generateAdScriptJSON(videoUrl),
        generateAdInsights(videoUrl)
      ]);

      const cleanedScriptResponse = scriptResponse.replace(/```json|```/g, ''); 
      setAdScript(JSON.parse(cleanedScriptResponse));
      console.log('Ad Insights Response:', insightsResponse); // Log the response
      const cleanedInsightsResponse = insightsResponse.replace(/```json|```/g, '');
      setAdInsights(JSON.parse(cleanedInsightsResponse));
    } catch (err) {
      if (err instanceof SyntaxError) {
        setError('Failed to parse ad script or insights. Please check the response format.');
      } else {
        setError('Failed to generate ad script or insights. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4 space-y-8">
      <h1 className="text-3xl font-bold mb-6">Ad Script Generator</h1>
      <form onSubmit={handleSubmit} className="mb-6">
        <input
          type="text"
          placeholder="Enter video URL"
          value={videoUrl}
          onChange={(e) => setVideoUrl(e.target.value)}
          required
          className="border p-2 rounded w-full mb-4"
        />
        <Button type="submit" disabled={loading} className="text-white p-2 rounded">
          {loading ? 'Generating...' : 'Generate Ad Script'}
        </Button>
      </form>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {adInsights && (
        <Card>
          <CardHeader>
            <CardTitle>Ad Insights</CardTitle>
          </CardHeader>
          <CardContent>
            <div>
              <h2 className="font-bold">Success Factors</h2>
              <ul>
                {adInsights.success_factors && Object.values(adInsights.success_factors).map((factor, index) => (
                  <li key={index}>{factor}</li>
                ))}
              </ul>
              <h2 className="font-bold">Areas for Improvement</h2>
              <ul>
                {adInsights.areas_for_improvement && Object.values(adInsights.areas_for_improvement).map((area, index) => (
                  <li key={index}>{area}</li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>
      )}
      {adScript && (
        <Tabs defaultValue="table">
          <TabsList>
            <TabsTrigger value="table">Table View</TabsTrigger>
            <TabsTrigger value="cards">Card View</TabsTrigger>
          </TabsList>
          <TabsContent value="table">
            <Card>
              <CardHeader>
                <CardTitle>Ad Script Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Framework Module</TableHead>
                        <TableHead>Description of Visuals</TableHead>
                        <TableHead>Voiceover Copy</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {adScript.FrameworkModule.map((module, index) => (
                        <TableRow key={index}>
                          <TableCell>{module.Module}</TableCell>
                          <TableCell>{module.DescriptionOfVisuals}</TableCell>
                          <TableCell>{module.VoiceoverCopy}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="cards">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {adScript.FrameworkModule.map((module, index) => (
                <Card key={index}>
                  <CardHeader>
                    <CardTitle>{module.Module}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p><strong>Description of Visuals:</strong> {module.DescriptionOfVisuals}</p>
                    <p><strong>Voiceover Copy:</strong> {module.VoiceoverCopy}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};

export default AdScriptGenerator;