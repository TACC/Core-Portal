import { NvViewer } from '@niivue/nvreact';

type NvPreviewProps = {
  url: string;
  name: string;
};

export default function NvPreview({ url, name }: NvPreviewProps) {
  return <NvViewer volumes={[{ url, name }]} style={{ height: 600 }} />;
}
