export const WhatsAppButton = () => {
  return (
    <a
      href="https://api.whatsapp.com/send?text=Hola%2C%20quiero%20informaci%C3%B3n%20sobre%20mi%20garant%C3%ADa"
      target="_blank"
      rel="noreferrer"
      aria-label="Contactar por WhatsApp"
      className="fixed bottom-6 right-4 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-soft transition-transform duration-300 hover:scale-110 md:bottom-8 md:right-8 md:h-16 md:w-16"
    >
      <svg
        viewBox="0 0 32 32"
        aria-hidden="true"
        className="h-8 w-8 md:h-9 md:w-9"
        fill="currentColor"
      >
        <path d="M16.02 3.2A12.77 12.77 0 0 0 5.1 22.58L3.5 28.8l6.36-1.56A12.77 12.77 0 1 0 16.02 3.2Zm0 23.34a10.56 10.56 0 0 1-5.38-1.47l-.38-.22-3.76.92 1-3.67-.25-.39a10.56 10.56 0 1 1 8.77 4.83Zm5.8-7.9c-.32-.16-1.88-.93-2.17-1.03-.29-.11-.5-.16-.71.16-.21.31-.82 1.03-1 1.24-.18.21-.37.24-.69.08-.32-.16-1.34-.49-2.55-1.57-.94-.84-1.58-1.88-1.76-2.2-.18-.31-.02-.48.14-.64.14-.14.32-.37.48-.55.16-.18.21-.32.32-.53.1-.21.05-.39-.03-.55-.08-.16-.71-1.71-.97-2.34-.26-.62-.52-.54-.71-.55h-.61c-.21 0-.55.08-.84.39-.29.31-1.1 1.08-1.1 2.63 0 1.55 1.13 3.05 1.29 3.26.16.21 2.23 3.4 5.4 4.77.75.32 1.34.52 1.8.66.76.24 1.45.21 2 .13.61-.09 1.88-.77 2.15-1.51.26-.74.26-1.37.18-1.51-.08-.13-.29-.21-.61-.37Z" />
      </svg>
    </a>
  );
};