import { CodeArtifactType } from '@refly/openapi-schema';

export interface MonacoEditorProps {
  content: string;
  language: string;
  type: CodeArtifactType;
  readOnly?: boolean;
  isGenerating?: boolean;
  canvasReadOnly?: boolean;
  onChange?: (value: string) => void;
}
