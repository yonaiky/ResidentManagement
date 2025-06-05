import WhatsAppQR from './WhatsAppQR';

export default function WhatsAppPage() {
  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-2xl font-bold text-center mb-6">
          Configuración de WhatsApp
        </h1>
        <WhatsAppQR />
      </div>
    </div>
  );
} 