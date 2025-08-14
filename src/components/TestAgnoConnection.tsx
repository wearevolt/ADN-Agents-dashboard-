import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getPlaygroundAgentsAPI, getPlaygroundStatusAPI } from "@/api/playground";
import { AGNO_CONFIG, ALTERNATIVE_ENDPOINTS } from "@/lib/config";

export const TestAgnoConnection: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const [agents, setAgents] = useState<any[]>([]);
  const [testResults, setTestResults] = useState<string[]>([]);
  const [workingEndpoint, setWorkingEndpoint] = useState<string | null>(null);

  const testSingleEndpoint = async (baseUrl: string, apiKey: string) => {
    const testEndpoints = [
      { name: "Health", path: "/health" },
      { name: "Status", path: "/status" },
      { name: "Models", path: "/models" },
      { name: "Agents", path: "/agents" },
      { name: "V1 Status", path: "/v1/status" },
    ];

    const results: string[] = [];
    let hasWorking = false;

    for (const endpoint of testEndpoints) {
      try {
        const url = `${baseUrl}${endpoint.path}`;
        const response = await fetch(url, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
        });

        const statusText = response.ok ? "✅ OK" : `❌ ${response.status}`;
        results.push(`${baseUrl}${endpoint.path}: ${statusText}`);

        if (response.ok) {
          hasWorking = true;
          if (endpoint.name.includes("Models") || endpoint.name.includes("Agents")) {
            try {
              const data = await response.json();
              const agentsList = Array.isArray(data) ? data : data.data || [];
              setAgents(agentsList);
            } catch (e) {
              console.log("Could not parse response as JSON");
            }
          }
        }
      } catch (error) {
        results.push(`${baseUrl}${endpoint.path}: ❌ Network Error`);
      }
    }

    return { results, hasWorking };
  };

  const testConnection = async () => {
    setIsLoading(true);
    setStatus("idle");
    setMessage("");
    setAgents([]);
    setTestResults([]);
    setWorkingEndpoint(null);

    const allResults: string[] = [];
    let foundWorking = false;

    // Тестируем все альтернативные endpoints
    for (const endpoint of ALTERNATIVE_ENDPOINTS) {
      allResults.push(`\n🔍 Тестируем: ${endpoint}`);
      const { results, hasWorking } = await testSingleEndpoint(endpoint, AGNO_CONFIG.API_KEY);
      allResults.push(...results);

      if (hasWorking && !foundWorking) {
        setWorkingEndpoint(endpoint);
        foundWorking = true;
      }
    }

    setTestResults(allResults);

    if (foundWorking) {
      setStatus("success");
      setMessage(`Найден рабочий endpoint: ${workingEndpoint}`);
    } else {
      setStatus("error");
      setMessage("Ни один endpoint не доступен. Возможно нужно запустить локальный Agno сервер.");
    }

    setIsLoading(false);
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>🔧 Диагностика API подключения</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <p className="text-sm text-gray-600">
            <strong>Текущий API URL:</strong> {AGNO_CONFIG.API_URL}
          </p>
          <p className="text-sm text-gray-600">
            <strong>API Key:</strong> {AGNO_CONFIG.API_KEY.substring(0, 20)}...
          </p>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h4 className="font-medium text-yellow-800 mb-2">⚠️ Проблема найдена:</h4>
          <p className="text-sm text-yellow-700">
            Хост <code>api.agno.ai</code> недоступен. Agno - это локальный фреймворк, нужно
            запустить сервер локально.
          </p>
        </div>

        <Button onClick={testConnection} disabled={isLoading} className="w-full">
          {isLoading ? "Тестирование всех endpoints..." : "Найти рабочий API endpoint"}
        </Button>

        {testResults.length > 0 && (
          <div className="mt-4">
            <h4 className="font-medium mb-2">Результаты проверки:</h4>
            <div className="max-h-60 overflow-y-auto space-y-1">
              {testResults.map((result, index) => (
                <div
                  key={index}
                  className={`text-sm font-mono p-2 rounded ${
                    result.includes("🔍") ? "bg-blue-100 font-bold" : "bg-gray-100"
                  }`}
                >
                  {result}
                </div>
              ))}
            </div>
          </div>
        )}

        {status !== "idle" && (
          <div className="space-y-2">
            <Badge variant={status === "success" ? "default" : "destructive"}>
              {status === "success" ? "Найден рабочий endpoint" : "Нет доступных endpoints"}
            </Badge>
            <p className="text-sm">{message}</p>

            {workingEndpoint && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-sm text-green-700">
                  💡 <strong>Рекомендация:</strong> Установите endpoint в сайдбаре:
                  <code className="bg-green-100 px-1 rounded">{workingEndpoint}</code>
                </p>
              </div>
            )}
          </div>
        )}

        {agents.length > 0 && (
          <div className="mt-4">
            <h4 className="font-medium mb-2">🤖 Найденные агенты:</h4>
            <div className="space-y-2">
              {agents.map((agent, index) => (
                <div key={index} className="p-2 bg-gray-50 rounded text-sm">
                  <strong>{agent.label || agent.name || agent.id}</strong>
                  {agent.model && <span className="ml-2 text-gray-600">({agent.model})</span>}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-medium text-blue-800 mb-2">💡 Как запустить Agno локально:</h4>
          <ol className="text-sm text-blue-700 list-decimal list-inside space-y-1">
            <li>
              Установите: <code>pip install agno</code>
            </li>
            <li>Создайте Python файл с агентом</li>
            <li>
              Запустите: <code>agno serve --port 7777</code>
            </li>
            <li>
              Используйте endpoint: <code>http://localhost:7777</code>
            </li>
          </ol>
        </div>
      </CardContent>
    </Card>
  );
};
