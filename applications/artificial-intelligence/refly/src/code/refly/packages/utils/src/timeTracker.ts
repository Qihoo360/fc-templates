interface StepTiming {
  startTime: number;
  endTime?: number;
  duration?: number;
}

export class TimeTracker {
  private steps: Map<string, StepTiming> = new Map();
  private startTime: number;

  constructor() {
    this.startTime = Date.now();
  }

  /**
   * Start timing a step
   * @param stepName Name of the step to time
   */
  startStep(stepName: string) {
    this.steps.set(stepName, {
      startTime: Date.now(),
    });
  }

  /**
   * End timing a step and return its duration
   * @param stepName Name of the step to end
   * @returns Duration of the step in milliseconds
   */
  endStep(stepName: string): number {
    const step = this.steps.get(stepName);
    if (!step) {
      throw new Error(`Step "${stepName}" was not started`);
    }

    const endTime = Date.now();
    const duration = endTime - step.startTime;

    this.steps.set(stepName, {
      ...step,
      endTime,
      duration,
    });

    return duration;
  }

  /**
   * Get duration of a specific step
   * @param stepName Name of the step
   * @returns Duration of the step in milliseconds, or undefined if step not completed
   */
  getStepDuration(stepName: string): number | undefined {
    return this.steps.get(stepName)?.duration;
  }

  /**
   * Get summary of all completed steps
   */
  getSummary() {
    const totalDuration = Date.now() - this.startTime;
    const stepResults: { [key: string]: number } = {};
    let completedStepsDuration = 0;

    this.steps.forEach((timing, stepName) => {
      if (timing.duration) {
        stepResults[stepName] = timing.duration;
        completedStepsDuration += timing.duration;
      }
    });

    return {
      steps: stepResults,
      totalDuration,
      completedStepsDuration,
    };
  }

  /**
   * Get formatted summary string
   */
  getFormattedSummary() {
    const summary = this.getSummary();
    const lines = ['Search Process Timing:'];

    for (const [stepName, duration] of Object.entries(summary.steps)) {
      lines.push(`  ${stepName}: ${duration}ms`);
    }

    lines.push('');
    lines.push(`Total Process Time: ${summary.totalDuration}ms`);
    lines.push(`Steps Duration: ${summary.completedStepsDuration}ms`);

    return lines.join('\n');
  }
}
