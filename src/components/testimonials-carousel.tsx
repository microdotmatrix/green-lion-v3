import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import type { Testimonial } from "@/lib/db/schema";
import { cn } from "@/lib/utils";

interface TestimonialsCarouselProps {
  testimonials: Testimonial[];
}

export function TestimonialsCarousel({
  testimonials,
}: TestimonialsCarouselProps) {
  if (testimonials.length === 0) {
    return null;
  }

  return (
    <Carousel
      opts={{ loop: true, align: "center" }}
      className="mx-auto w-full max-w-4xl"
    >
      <CarouselContent>
        {testimonials.map((testimonial) => (
          <CarouselItem key={testimonial.id}>
            <figure className="flex flex-col items-center text-center px-4 md:px-12">
              <blockquote className="text-foreground">
                <p className="fl-text-base/xl text-balance leading-relaxed">
                  "{testimonial.quote}"
                </p>
              </blockquote>
              <figcaption className="mt-8 flex flex-col items-center gap-4">
                {testimonial.companyLogo && (
                  <img
                    src={testimonial.companyLogo}
                    alt={`${testimonial.companyName} logo`}
                    className="h-10 w-auto object-contain"
                    loading="lazy"
                  />
                )}
                <div className="flex flex-row items-center gap-4">
                  <cite className="italic font-semibold text-foreground">
                    {testimonial.author},
                  </cite>
                  <span className="flex flex-row items-center gap-2">
                    {testimonial.authorTitle && (
                      <span className="text-muted-foreground">
                        {testimonial.authorTitle}
                      </span>
                    )}
                    {testimonial.companyLink ? (
                      <a
                        href={testimonial.companyLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        {testimonial.companyName}
                      </a>
                    ) : (
                      <span className="text-muted-foreground">
                        {testimonial.companyName}
                      </span>
                    )}
                  </span>
                </div>
              </figcaption>
            </figure>
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious
        className={cn(
          "left-0 md:-left-12",
          "bg-background/80 hover:bg-background",
        )}
      />
      <CarouselNext
        className={cn(
          "right-0 md:-right-12",
          "bg-background/80 hover:bg-background",
        )}
      />
    </Carousel>
  );
}
