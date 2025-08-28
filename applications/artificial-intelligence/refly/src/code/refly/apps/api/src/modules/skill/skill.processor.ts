import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';

import { SkillService } from './skill.service';
import { QUEUE_SKILL, QUEUE_CHECK_STUCK_ACTIONS } from '../../utils/const';
import { InvokeSkillJobData, CheckStuckActionsJobData } from './skill.dto';

@Processor(QUEUE_SKILL)
export class SkillProcessor extends WorkerHost {
  private readonly logger = new Logger(SkillProcessor.name);

  constructor(private skillService: SkillService) {
    super();
  }

  async process(job: Job<InvokeSkillJobData>) {
    this.logger.log(`[handleInvokeSkill] job: ${JSON.stringify(job)}`);

    try {
      await this.skillService.invokeSkillFromQueue(job.data);
    } catch (error) {
      this.logger.error(`[handleInvokeSkill] error: ${error?.stack}`);
      throw error;
    }
  }
}

@Processor(QUEUE_CHECK_STUCK_ACTIONS)
export class CheckStuckActionsProcessor extends WorkerHost {
  private readonly logger = new Logger(CheckStuckActionsProcessor.name);

  constructor(private skillService: SkillService) {
    super();
  }

  async process(job: Job<CheckStuckActionsJobData>) {
    this.logger.log(`[handleCheckStuckActions] job: ${JSON.stringify(job.id)}`);

    try {
      await this.skillService.checkStuckActions();
    } catch (error) {
      this.logger.error(`[handleCheckStuckActions] error: ${error?.stack}`);
      throw error;
    }
  }
}
