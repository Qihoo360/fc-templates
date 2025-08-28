import { FC, useState } from 'react';
import { EditorInstance } from '@refly-packages/ai-workspace-common/components/editor/core/components';
import { Divider } from 'antd';
import { NodeSelector } from '@refly-packages/ai-workspace-common/components/editor/components/selectors/node-selector';
import { TextButtons } from '@refly-packages/ai-workspace-common/components/editor/components/selectors/text-buttons';
import { LinkSelector } from '@refly-packages/ai-workspace-common/components/editor/components/selectors/link-selector';
import { ColorSelector } from '@refly-packages/ai-workspace-common/components/editor/components/selectors/color-selector';
import './memo-editor.scss';
import CommonColorPicker from '../shared/color-picker';

type MemoEditorProps = {
  editor: EditorInstance;
  bgColor: string;
  onChangeBackground?: (bgColor: string) => void;
};

export const MemoEditor: FC<MemoEditorProps> = ({ editor, bgColor, onChangeBackground }) => {
  const [openNode, setOpenNode] = useState(false);
  const [openLink, setOpenLink] = useState(false);
  const [openColor, setOpenColor] = useState(false);

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <NodeSelector open={openNode} onOpenChange={setOpenNode} triggerEditor={editor} />
        <Divider className="mx-0 h-3" type="vertical" />
        <ColorSelector open={openColor} onOpenChange={setOpenColor} triggerEditor={editor} />

        <TextButtons triggerEditor={editor} />
        <Divider className="mx-0 h-3" type="vertical" />
        <LinkSelector open={openLink} onOpenChange={setOpenLink} triggerEditor={editor} />
      </div>

      <CommonColorPicker color={bgColor} onChange={onChangeBackground} />
    </div>
  );
};
