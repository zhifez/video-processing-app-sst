import UploadVideoForm from '@/components/upload-video-form';

export default async function Home() {
  return (
    <main className="p-8 flex flex-col justify-center items-center gap-4">
      <UploadVideoForm />
    </main>
  );
}