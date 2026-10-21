import { AdminGuard } from "@/components/AdminGuard";

function NotificationsDashboard() {
  return <div className="admin-page">
    <div className="admin-head"><div><h1>नोटिफिकेशन सिस्टम</h1><p className="sub">Rojgar Sathi — ईमेल, WhatsApp और ब्राउज़र अलर्ट</p></div></div>
    <div className="form-grid">
      <section className="admin-card"><h2>ईमेल अलर्ट</h2><p>विज़िटर बिना अकाउंट के ईमेल अलर्ट के लिए सहमति दे सकते हैं। वास्तविक ईमेल भेजने के लिए SMTP/ईमेल प्रदाता और सर्वर-साइड API जोड़ना आवश्यक है।</p><span className="badge">प्राथमिकताएँ सेव करने का आधार तैयार</span></section>
      <section className="admin-card"><h2>WhatsApp अलर्ट</h2><p>मोबाइल नंबर केवल स्पष्ट सहमति के बाद लिया जाता है। संदेश भेजने के लिए WhatsApp Business Platform/स्वीकृत प्रदाता, टेम्पलेट और सुरक्षित सर्वर API credentials जरूरी हैं।</p><span className="badge">प्रदाता कनेक्शन बाकी</span></section>
      <section className="admin-card"><h2>ब्राउज़र पुश</h2><p>वेबसाइट पर उपयोगकर्ता के बटन दबाने के बाद ही ब्राउज़र अनुमति माँगी जाती है। वास्तविक पुश संदेशों के लिए HTTPS, service worker, VAPID keys और server push endpoint आवश्यक हैं।</p><span className="badge">अनुमति UI तैयार; पुश सर्वर बाकी</span></section>
      <section className="admin-card"><h2>ज़रूरी अगला सेटअप</h2><ol><li>Supabase SQL Editor में <code>supabase/migrations/20261022_notification_subscriptions.sql</code> चलाएँ।</li><li>ईमेल प्रदाता और WhatsApp Business API के secrets केवल Vercel Environment Variables में रखें—ब्राउज़र कोड या GitHub में नहीं।</li><li>VAPID public/private keys और service worker push handling जोड़ें।</li><li>असली संदेश भेजने से पहले unsubscribe/opt-out और डिलीवरी लॉग की जाँच करें।</li></ol></section>
    </div>
  </div>;
}
export default function AdminNotifications() { return <AdminGuard><NotificationsDashboard /></AdminGuard>; }
