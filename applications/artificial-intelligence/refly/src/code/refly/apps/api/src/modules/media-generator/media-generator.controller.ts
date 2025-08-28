import { Controller, UseGuards, Post, Body } from '@nestjs/common';
import { MediaGeneratorService } from './media-generator.service';
import { LoginedUser } from '../../utils/decorators/user.decorator';
import { JwtAuthGuard } from '../auth/guard/jwt-auth.guard';
import { User, MediaGenerateRequest, MediaGenerateResponse } from '@refly/openapi-schema';
@Controller('v1/media')
export class MediaGeneratorController {
  constructor(private readonly mediaGeneratorService: MediaGeneratorService) {}

  @UseGuards(JwtAuthGuard)
  @Post('generate')
  async generateMedia(
    @LoginedUser() user: User,
    @Body() request: MediaGenerateRequest,
  ): Promise<MediaGenerateResponse> {
    return this.mediaGeneratorService.generateMedia(user, request);
  }
}
