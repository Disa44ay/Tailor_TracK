import { useEffect, useState } from "react";
import HomeNav from "../components/home/HomeNav.jsx";
import Hero from "../components/home/Hero.jsx";
import FitStatement from "../components/home/FitStatement.jsx";
import Showcase from "../components/home/Showcase.jsx";
import Approaches from "../components/home/Approaches.jsx";
import Process from "../components/home/Process.jsx";
import HowItWorks from "../components/home/HowItWorks.jsx";
import Footer from "../components/home/Footer.jsx";
import AuthModal from "../components/home/AuthModal.jsx";
import BookingForm from "../components/booking/BookingForm.jsx";
import InquiriesPanel, { dotFor } from "../components/inquiries/InquiriesPanel.jsx";
import Dialog from "../components/Dialog.jsx";
import { useAuth } from "../app/AuthContext.jsx";
import { listEnquiries } from "../api/booking.js";

function HomePage() {
  const auth = useAuth();
  const signedIn = Boolean(auth?.token);
  const [authOpen, setAuthOpen] = useState(false);
  const [bookingOpen, setBookingOpen] = useState(false);
  const [inquiriesOpen, setInquiriesOpen] = useState(false);
  const [inquiryDot, setInquiryDot] = useState(null);

  // The dot tells the customer something changed. Check it now, every 30 seconds,
  // and when the window regains focus, so a studio reply shows without a reload.
  useEffect(() => {
    if (!signedIn) {
      setInquiryDot(null);
      return undefined;
    }
    function check() {
      listEnquiries()
        .then((list) => {
          const dots = list.map(dotFor);
          setInquiryDot(dots.includes("red") ? "red" : dots.includes("blue") ? "blue" : null);
        })
        .catch(() => {});
    }
    check();
    const timer = setInterval(check, 30000);
    window.addEventListener("focus", check);
    return () => {
      clearInterval(timer);
      window.removeEventListener("focus", check);
    };
  }, [signedIn, inquiriesOpen, bookingOpen]);

  // Signed-in visitors go straight to the booking form; everyone else logs in first.
  function handleBook() {
    if (signedIn) setBookingOpen(true);
    else setAuthOpen(true);
  }

  return (
    <>
      <HomeNav
        onLogin={() => setAuthOpen(true)}
        onBook={handleBook}
        onInquiries={() => setInquiriesOpen(true)}
        inquiryDot={inquiryDot}
      />
      <main id="top">
        <Hero onLetsGo={handleBook} />
        <FitStatement />
        <Showcase />
        <Approaches />
        <Process />
        <HowItWorks />
      </main>
      <Footer onBookConsultation={handleBook} />
      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
      <Dialog open={bookingOpen} onClose={() => setBookingOpen(false)} label="Book a consultation">
        <BookingForm onSubmitted={() => setBookingOpen(false)} />
      </Dialog>
      <Dialog open={inquiriesOpen} onClose={() => setInquiriesOpen(false)} label="My inquiries">
        <InquiriesPanel />
      </Dialog>
    </>
  );
}

export default HomePage;
