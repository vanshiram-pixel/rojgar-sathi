import Link from "next/link";
import { Facebook, Instagram, Mail, Phone, MessageCircle } from "lucide-react";

export const metadata = {
  title: "संपर्क करें | Rojgar Sathi",
  description: "Rojgar Sathi से भर्ती सूचना, वेबसाइट की समस्या या सुधार के लिए संपर्क करें।",
};

export default function ContactPage() {
  return (
    <main className="wrap page">
      <header className="header"><div className="wrap header-inner"><Link className="brand" href="/" aria-label="Rojgar Sathi home"><img className="brand-logo" src="/rojgar-sathi-logo.svg" alt="Rojgar Sathi" /></Link><Link href="/" className="text-link">← होम</Link></div></header>
      <h1 className="page-title">संपर्क करें</h1>
      <p>Rojgar Sathi पर प्रकाशित सूचना में सुधार, वेबसाइट से जुड़ी समस्या या सुझाव के लिए हमसे संपर्क करें। किसी भर्ती की पात्रता, शुल्क या आवेदन की अंतिम पुष्टि संबंधित विभाग की आधिकारिक अधिसूचना से ही करें।</p>
      <section className="section" aria-labelledby="contact-details">
        <h2 id="contact-details">संपर्क विवरण</h2>
        <p><Phone size={18} aria-hidden="true" /> <a href="tel:+919783040620">9783040620</a></p>
        <p><MessageCircle size={18} aria-hidden="true" /> <a href="https://wa.me/919783040620" target="_blank" rel="noopener noreferrer">WhatsApp पर संदेश भेजें</a></p>
        <p><Mail size={18} aria-hidden="true" /> <a href="mailto:riyanshemitra01@gmail.com">riyanshemitra01@gmail.com</a></p>
      </section>
      <section className="section" aria-labelledby="social-links">
        <h2 id="social-links">सोशल मीडिया</h2>
        <p><Facebook size={18} aria-hidden="true" /> <a href="https://www.facebook.com/vr.faujdar/" target="_blank" rel="noopener noreferrer">Facebook — vr.faujdar</a></p>
        <p><Instagram size={18} aria-hidden="true" /> <a href="https://www.instagram.com/p/B_x4S-xDkb7/" target="_blank" rel="noopener noreferrer">Instagram लिंक</a></p>
      </section>
      <p>कृपया संदेश में भर्ती का नाम और संबंधित आधिकारिक लिंक साझा करें, ताकि समस्या को सही ढंग से समझा जा सके।</p>
    </main>
  );
}
