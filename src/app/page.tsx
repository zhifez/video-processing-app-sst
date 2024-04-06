import UploadVideoForm from '@/components/upload-video-form';

export default async function Home() {
  return (
    <main className="p-8 flex justify-center">
      <UploadVideoForm />
    </main>
  );
}