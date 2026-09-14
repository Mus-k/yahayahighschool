import React from 'react';
import Link from 'next/link';
import { ArrowRight, Book } from 'lucide-react';
import { Container } from '@/components/ui/Container';
import { LearningApproachSection } from '@/components/public/academics/LearningApproachSection';

const academicPrograms = [
  {
    id: 'quran-memorization',
    title: "Qur'an Memorization",
    description: "Guided Hifz program with tajweed, understanding, and character building—rooted in love for the Qur'an.",
    image: 'https://images.unsplash.com/photo-1577896851231-70ef18881754?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'quran-memorization-2',
    title: "Qur'an Memorization",
    description: "Guided Hifz program with tajweed, understanding, and character building—rooted in love for the Qur'an.",
    image: 'https://images.unsplash.com/photo-1577896851231-70ef18881754?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'quran-memorization-3',
    title: "Qur'an Memorization",
    description: "Guided Hifz program with tajweed, understanding, and character building—rooted in love for the Qur'an.",
    image: 'https://images.unsplash.com/photo-1577896851231-70ef18881754?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'quran-memorization-4',
    title: "Qur'an Memorization",
    description: "Guided Hifz program with tajweed, understanding, and character building—rooted in love for the Qur'an.",
    image: 'https://images.unsplash.com/photo-1577896851231-70ef18881754?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'quran-memorization-5',
    title: "Qur'an Memorization",
    description: "Guided Hifz program with tajweed, understanding, and character building—rooted in love for the Qur'an.",
    image: 'https://images.unsplash.com/photo-1577896851231-70ef18881754?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'quran-memorization-6',
    title: "Qur'an Memorization",
    description: "Guided Hifz program with tajweed, understanding, and character building—rooted in love for the Qur'an.",
    image: 'https://images.unsplash.com/photo-1577896851231-70ef18881754?auto=format&fit=crop&w=800&q=80',
  },
];

export default function AcademicsPage() {
  return (
    <main className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="pt-32 pb-24 relative overflow-hidden">
        <Container>
          <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
            {/* Left Content */}
            <div className="w-full lg:w-1/2 flex flex-col">
              {/* Breadcrumbs */}
              <div className="flex items-center gap-2 text-sm text-slate-500 mb-8 font-medium">
                <Link href="/" className="hover:text-[#048ED6] transition-colors">Home</Link>
                <span className="text-slate-300">/</span>
                <span className="text-[#048ED6]">Departments</span>
              </div>
              
              <div className="mb-6">
                <span className="text-[#048ED6] text-sm font-bold tracking-widest uppercase mb-4 block">
                  Learning With Purpose
                </span>
                <h1 className="text-5xl md:text-6xl font-bold text-slate-900 leading-tight mb-2">
                  Knowledge Rooted in Faith.
                </h1>
                <h2 className="text-5xl md:text-6xl font-bold text-[#048ED6] italic leading-tight mb-8">
                  Excellence Built for Life.
                </h2>
              </div>
              
              <p className="text-slate-600 text-lg leading-relaxed max-w-xl">
                Rigorous academics, Islamic character, and global readiness—nurturing curious minds and compassionate hearts to lead with purpose and confidence.
              </p>
            </div>
            
            {/* Right Image */}
            <div className="w-full lg:w-1/2 relative">
              {/* Decorative background shape */}
              <div className="absolute top-0 right-0 w-[120%] h-[120%] bg-sky-50 rounded-full -translate-y-10 translate-x-20 -z-10" />
              
              <div className="relative rounded-t-[100px] rounded-br-[100px] rounded-bl-3xl overflow-hidden shadow-2xl aspect-[4/3] border-8 border-white">
                <img 
                  src="https://images.unsplash.com/photo-1529390079861-591de354faf5?auto=format&fit=crop&w=1200&q=80" 
                  alt="Students learning together"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
        </Container>
      </section>
      
      {/* Programs Grid Section */}
      <section className="py-24 bg-white">
        <Container>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
            {academicPrograms.map((program) => (
              <div key={program.id} className="flex flex-col bg-white rounded-3xl overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all group">
                {/* Card Top: Image */}
                <div className="relative w-full aspect-[21/9] overflow-hidden">
                  <img 
                    src={program.image} 
                    alt={program.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  {/* Floating Icon */}
                  <div className="absolute top-6 left-6 w-12 h-12 bg-[#048ED6] rounded-xl flex items-center justify-center text-white shadow-lg">
                    <Book className="w-6 h-6" />
                  </div>
                </div>
                
                {/* Card Bottom: Content */}
                <div className="p-8 md:p-10 flex flex-col flex-grow">
                  <Link 
                    href={`/departments/${program.id}`}
                    className="inline-flex items-center gap-2 text-[#048ED6] text-sm font-semibold hover:text-sky-600 transition-colors mb-4"
                  >
                    <span>Explore Program</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                  
                  <h3 className="text-2xl font-bold text-slate-900 mb-4">
                    {program.title}
                  </h3>
                  
                  <p className="text-slate-600 text-[1rem] leading-relaxed mb-8 flex-grow">
                    {program.description}
                  </p>
                  
                  <div>
                    <Link
                      href={`/departments/${program.id}`}
                      className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#048ED6] text-white text-sm font-medium rounded-full hover:bg-sky-500 transition-colors"
                    >
                      <span>Read More</span>
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* Shared Learning Approach Section */}
      <LearningApproachSection />
    </main>
  );
}
