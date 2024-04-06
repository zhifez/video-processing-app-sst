import UploadVideoForm from '@/components/upload-video-form';

export default async function Home() {
  return (
    <main className="p-4">
      <UploadVideoForm />
    </main>
  );
}