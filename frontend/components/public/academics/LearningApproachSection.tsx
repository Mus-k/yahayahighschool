import React from 'react';
import { Zap, Heart, UserCheck, Compass } from 'lucide-react';
import { Container } from '@/components/ui/Container';

export function LearningApproachSection() {
  return (
    <section className="py-24 bg-[#FAFAFA] w-full">
      <Container>
        <div className="max-w-6xl mx-auto flex flex-col lg:flex-row items-center gap-16">
          
          {/* Left: Image with Badge */}
          <div className="w-full lg:w-1/2 relative">
            <div className="w-full aspect-[4/3] rounded-2xl overflow-hidden shadow-xl">
              <img 
                src="https://images.unsplash.com/photo-1577896851231-70ef18881754?auto=format&fit=crop&w=1000&q=80" 
                alt="Students collaborating" 
                className="w-full h-full object-cover"
              />
            </div>
            
            {/* Floating Badge */}
            <div className="absolute -bottom-6 -right-6 md:right-8 bg-[#048ED6] text-white p-6 rounded-xl shadow-2xl w-56 transform translate-y-4 md:translate-y-0">
              <div className="text-4xl font-bold mb-2">98%</div>
              <p className="text-base font-semibold tracking-wider uppercase leading-snug">
                University Placement Rate for our Graduates
              </p>
            </div>
          </div>
          
          {/* Right: Content & List */}
          <div className="w-full lg:w-1/2 mt-12 lg:mt-0">
            <div className="mb-10">
              <span className="text-[#048ED6] text-sm font-bold tracking-widest uppercase mb-4 block">
                Our Approach
              </span>
              <h2 className="text-4xl md:text-5xl font-bold text-slate-900 leading-tight">
                How Learning Comes to Life
              </h2>
            </div>
            
            <div className="flex flex-col gap-8">
              
              {/* Item 1 */}
              <div className="flex gap-6">
                <div className="w-12 h-12 shrink-0 rounded-full bg-sky-50 flex items-center justify-center text-[#048ED6]">
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900 mb-2">Academic Rigor</h3>
                  <p className="text-slate-600 leading-relaxed">
                    Challenging curriculum and high expectations that inspire deep understanding and excellence in every subject.
                  </p>
                </div>
              </div>
              
              {/* Item 2 */}
              <div className="flex gap-6">
                <div className="w-12 h-12 shrink-0 rounded-full bg-sky-50 flex items-center justify-center text-[#048ED6]">
                  <Heart className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900 mb-2">Faith & Character</h3>
                  <p className="text-slate-600 leading-relaxed">
                    Islamic values are woven into daily learning to nurture integrity, compassion, and a sense of purpose.
                  </p>
                </div>
              </div>
              
              {/* Item 3 */}
              <div className="flex gap-6">
                <div className="w-12 h-12 shrink-0 rounded-full bg-sky-50 flex items-center justify-center text-[#048ED6]">
                  <UserCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900 mb-2">Mentorship</h3>
                  <p className="text-slate-600 leading-relaxed">
                    Caring teachers guide each student through personalized support and meaningful relationships beyond the textbook.
                  </p>
                </div>
              </div>
              
              {/* Item 4 */}
              <div className="flex gap-6">
                <div className="w-12 h-12 shrink-0 rounded-full bg-sky-50 flex items-center justify-center text-[#048ED6]">
                  <Compass className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900 mb-2">Real-World Discovery</h3>
                  <p className="text-slate-600 leading-relaxed">
                    Experiential projects, fieldwork, and technology connect classroom learning to the world around us.
                  </p>
                </div>
              </div>
              
            </div>
          </div>
          
        </div>
      </Container>
    </section>
  );
}
