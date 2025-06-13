// src/lib/autopilot/autopilotService.ts

export async function runAutopilotTask(task: string, payload: any) {
  // Mocked response for now
  return {
    status: "success",
    message: `Autopilot ran task: ${task}`,
    data: payload,
  };
}

export async function getAutopilotStatus() {
  // Mocked status
  return {
    running: false,
    lastRun: new Date().toISOString(),
  };
}
