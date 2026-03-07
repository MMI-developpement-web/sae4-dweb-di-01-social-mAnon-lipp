const LOGO_SRC = "/20260307_1245_Image Generation_remix_01kk41v993esavk7xpb3br8675.png";

export default function NavBar() {
  return (
    <header className="sticky top-0 z-10 bg-white border-b border-border-muted">
      <div className="flex items-center justify-between px-5 py-3">
        <img
          src={LOGO_SRC}
          alt="Logo"
          className="w-[58px] h-[65px] object-contain"
        />
      </div>
    </header>
  );
}
