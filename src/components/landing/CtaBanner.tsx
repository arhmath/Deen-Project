import { Link } from "react-router-dom";
import { Button } from "../ui/Button";
import { StarIcon, SparkleIcon } from "./DecorativeIcons";

export function CtaBanner() {
  return (
    <section className="px-5 pb-20">
      <div className="relative mx-auto max-w-6xl overflow-hidden rounded-[2.5rem] bg-brand-purple px-8 py-14 text-center shadow-[0_8px_0_0_#5B1FB0]">
        <StarIcon
          className="absolute left-10 top-8 h-6 w-6 text-brand-gold motion-safe:animate-twinkle"
          aria-hidden="true"
        />
        <SparkleIcon
          className="absolute bottom-10 right-14 h-8 w-8 text-brand-yellow motion-safe:animate-twinkle [animation-delay:1s]"
          aria-hidden="true"
        />

        <h2 className="mx-auto max-w-xl font-display text-3xl font-extrabold text-white md:text-4xl">
          Yuk mulai level pertama malam ini
        </h2>
        <p className="mx-auto mt-3 max-w-md font-body text-white/80">
          Daftar gratis, gabung ke room kelas, dan kumpulkan XP pertamamu.
        </p>
        <div className="mt-8 flex justify-center gap-4">
          <Link to="/register">
            <Button variant="secondary" size="lg" className="text-white font-bold">
              Daftar Sekarang
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
