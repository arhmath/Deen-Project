import { Dialog } from "../../components/ui/Dialog";
import { Button } from "../../components/ui/Button";
import { SparkleIcon, StarIcon } from "../../components/landing/DecorativeIcons";

export function LevelUpDialog({
  levelUp,
  onClose,
}: {
  levelUp: { to: number; name: string } | null;
  onClose: () => void;
}) {
  return (
    <Dialog open={!!levelUp} onClose={onClose} labelledBy="levelup-title">
      <div className="relative overflow-hidden rounded-3xl border-2 border-brand-purple-dark bg-brand-purple p-8 text-center text-white shadow-[0_8px_0_0_#5B1FB0]">
        <SparkleIcon className="absolute left-6 top-6 h-5 w-5 text-brand-gold motion-safe:animate-twinkle" />
        <StarIcon className="absolute right-8 top-10 h-4 w-4 text-brand-yellow motion-safe:animate-twinkle [animation-delay:1s]" />
        <StarIcon className="mx-auto h-20 w-20 text-brand-gold motion-safe:animate-float" />
        <h2 id="levelup-title" className="mt-4 font-display text-3xl font-extrabold">
          Naik ke Level {levelUp?.to}!
        </h2>
        <p className="mt-1 text-white/80">Sekarang kamu {levelUp?.name}. Keren, terus semangat!</p>
        <Button variant="secondary" className="mt-6" fullWidth onClick={onClose}>
          Lanjut belajar
        </Button>
      </div>
    </Dialog>
  );
}
