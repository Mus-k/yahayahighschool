import React from 'react';
import Link from 'next/link';
import { ArrowRight, Download, CheckCircle2, GraduationCap } from 'lucide-react';
import { Container } from '@/components/ui/Container';
import { LearningApproachSection } from '@/components/public/academics/LearningApproachSection';

export default async function AcademicDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  
  // In a real app, you would fetch data based on the slug here.
  // We'll use static mock data representing the Qur'an Memorization detail page.

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
                <Link href="/departments" className="hover:text-[#048ED6] transition-colors">Departments</Link>
                <span className="text-slate-300">/</span>
                <span className="text-[#048ED6]">Department-details</span>
              </div>
              
              <div className="mb-6">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-sky-50 border border-sky-100 text-[#048ED6] text-xs font-bold tracking-widest uppercase mb-6">
                  <GraduationCap className="w-4 h-4" />
                  <span>Academic Excellence</span>
                </div>
                <h1 className="text-5xl md:text-6xl font-bold text-slate-900 leading-tight mb-2">
                  Knowledge Rooted in Faith.
                </h1>
                <h2 className="text-5xl md:text-6xl font-bold text-[#048ED6] italic leading-tight mb-8">
                  Excellence Built for Life.
                </h2>
              </div>
              
              <p className="text-slate-600 text-lg leading-relaxed mb-10 max-w-xl">
                Yahaya International's Quran Memorization & Hifz Program offers a scholarly environment where spiritual devotion meets academic rigor, nurturing tomorrow's leaders through the wisdom of the Holy Quran.
              </p>
              
              <div className="flex flex-wrap items-center gap-4">
                <Link
                  href="/admissions"
                  className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-[#048ED6] text-white text-[15px] font-semibold rounded-full hover:bg-sky-500 transition-colors shadow-md hover:shadow-lg"
                >
                  <span>Apply for Admission</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
                
                <button
                  className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-white text-[#048ED6] border border-[#048ED6] text-[15px] font-semibold rounded-full hover:bg-sky-50 transition-colors"
                >
                  <span>Download Pdf</span>
                  <Download className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            {/* Right Image */}
            <div className="w-full lg:w-1/2 relative">
              <div className="relative rounded-t-[100px] rounded-br-[100px] rounded-bl-3xl overflow-hidden shadow-2xl aspect-[4/3] border-8 border-white">
                <img 
                  src="https://images.unsplash.com/photo-1609599006353-e629aaab315d?auto=format&fit=crop&w=1200&q=80" 
                  alt="Student reciting Quran"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* Pathway Section */}
      <section className="py-24 bg-white border-t border-slate-100">
        <Container>
          <div className="flex flex-col lg:flex-row gap-16 lg:gap-24 items-center">
            
            {/* Left: Text and List */}
            <div className="w-full lg:w-1/2 flex flex-col">
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-6">
                The Hifz Pathway
              </h2>
              
              <p className="text-slate-600 text-[1rem] leading-relaxed mb-10">
                Our Quran Memorization program is more than a curriculum; it is a transformative journey. We combine traditional Ottoman and African memorization techniques with modern pedagogical approaches to ensure deep retention and authentic Tajweed.
              </p>
              
              <div className="flex flex-col gap-8">
                {/* Pathway Items */}
                {[
                  { title: 'Intensive Memorization', desc: 'Daily structured sessions focused on new verses, previous revision, and long-term retention.' },
                  { title: 'Tafsir & Understanding', desc: 'Weekly sessions exploring the context and meaning of the memorized portions.' },
                  { title: 'Tajweed Mastery', desc: 'Rigorous phonetics training ensuring perfect pronunciation and adherence to recitation rules.' },
                  { title: 'Character Building', desc: 'Aligning student behavior with the morals and ethics found within the memorized texts.' },
                ].map((item, idx) => (
                  <div key={idx} className="flex gap-4">
                    <div className="shrink-0 mt-1">
                      <CheckCircle2 className="w-6 h-6 text-[#048ED6]" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-900 mb-1">{item.title}</h3>
                      <p className="text-slate-600 text-base leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Masonry Images */}
            <div className="w-full lg:w-1/2">
              <div className="grid grid-cols-2 gap-4 h-[500px]">
                {/* Tall left image */}
                <div className="col-span-1 rounded-2xl overflow-hidden shadow-lg h-full">
                  <img 
                    src="https://images.unsplash.com/photo-1584551246679-0daf3d275d0f?auto=format&fit=crop&w=800&q=80" 
                    alt="Quran on stand"
                    className="w-full h-full object-cover"
                  />
                </div>
                {/* Two stacked right images */}
                <div className="col-span-1 grid grid-rows-2 gap-4 h-full">
                  <div className="row-span-1 rounded-2xl overflow-hidden shadow-lg h-full">
                    <img 
                      src="https://images.unsplash.com/photo-1577896851231-70ef18881754?auto=format&fit=crop&w=600&q=80" 
                      alt="Teacher and student"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="row-span-1 rounded-2xl overflow-hidden shadow-lg h-full">
                    <img 
                      src="https://images.unsplash.com/photo-1529390079861-591de354faf5?auto=format&fit=crop&w=600&q=80" 
                      alt="Students collaborating"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              </div>
            </div>

          </div>
        </Container>
      </section>

      {/* Shared Learning Approach Section */}
      <LearningApproachSection />
    </main>
  );
}
