import { Module } from '@nestjs/common';
import { McpModule, McpTransportType } from '@rekog/mcp-nest';
import { JwtAuthGuard } from '../auth/guard/jwt-auth.guard';
import { McpServerService } from '../mcp-server/mcp-server.service';
import { PrismaService } from '../common/prisma.service';
import { EncryptionService } from '../common/encryption.service';
import { InternalMcpService } from './internal-mcp.service';
import { SearchTools } from './tools/search.tools';
import { MediaGeneratorTools } from './tools/media-generator.tools';
import { ProviderQueryTools } from './tools/provider-query.tools';
import { SearchService } from '../search/search.service';
import { RAGModule } from '../rag/rag.module';
import { ProviderModule } from '../provider/provider.module';
import { CommonModule } from '../common/common.module';
import { MediaGeneratorModule } from '../media-generator/media-generator.module';
import { ActionModule } from '../action/action.module';

@Module({
  imports: [
    McpModule.forRoot({
      name: 'refly-mcp-server',
      version: '1.0.0',
      guards: [JwtAuthGuard], // Use JwtAuthGuard to protect MCP endpoints
      transport: McpTransportType.STREAMABLE_HTTP, // Use Streamable HTTP transport
      // Default endpoint is /mcp
    }),
    CommonModule,
    RAGModule,
    ProviderModule,
    MediaGeneratorModule,
    ActionModule,
  ],
  providers: [
    InternalMcpService,
    McpServerService,
    PrismaService,
    EncryptionService,
    // McpServerTools,
    SearchTools,
    MediaGeneratorTools,
    ProviderQueryTools,
    SearchService,
    JwtAuthGuard,
  ],
  exports: [InternalMcpService],
})
export class InternalMcpModule {}
