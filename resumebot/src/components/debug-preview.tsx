"use client";
import { Navbar } from "./navbar";

export const DebugPreview = () => {
  return (
    <div className="min-h-screen bg-black">
      <Navbar />
      <div className="pt-24 pb-20 px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-white text-3xl mb-8 text-center">Debug Resume Preview</h1>
          
          {/* Test 1: Simple white box */}
          <div className="mb-8">
            <h2 className="text-white text-xl mb-4">Test 1: Simple White Box</h2>
            <div className="w-64 h-80 bg-white border-2 border-red-500 p-4">
              <h3 className="text-black text-lg font-bold">JOHN SMITH</h3>
              <p className="text-black">Software Engineer</p>
              <p className="text-black">john@email.com</p>
            </div>
          </div>

          {/* Test 2: With aspect ratio */}
          <div className="mb-8">
            <h2 className="text-white text-xl mb-4">Test 2: With Aspect Ratio</h2>
            <div className="w-64 aspect-[3/4] bg-white border-2 border-green-500 p-4">
              <h3 className="text-black text-lg font-bold">JANE DOE</h3>
              <p className="text-black">Product Manager</p>
              <p className="text-black">jane@email.com</p>
            </div>
          </div>

          {/* Test 3: Nested divs */}
          <div className="mb-8">
            <h2 className="text-white text-xl mb-4">Test 3: Nested Structure</h2>
            <div className="w-64 aspect-[3/4] bg-slate-100 border-2 border-blue-500 flex items-center justify-center">
              <div className="w-full h-full bg-white p-4">
                <h3 className="text-black text-lg font-bold">ALEX JOHNSON</h3>
                <p className="text-black">Designer</p>
                <p className="text-black">alex@email.com</p>
                <div className="mt-2">
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded">React</span>
                </div>
              </div>
            </div>
          </div>

          {/* Test 4: Exact same structure as our template */}
          <div className="mb-8">
            <h2 className="text-white text-xl mb-4">Test 4: Template Structure</h2>
            <div className="aspect-[3/4] bg-slate-100 border-2 border-slate-300 rounded-lg flex items-center justify-center relative overflow-hidden">
              <div className="w-full h-full bg-white p-3 text-black text-[10px] overflow-hidden">
                <div className="border-b border-gray-300 pb-2 mb-2">
                  <h1 className="text-sm font-bold text-gray-900">JOHN SMITH</h1>
                  <div className="text-gray-600 text-[8px]">
                    <p>john.smith@email.com • (555) 123-4567</p>
                  </div>
                </div>
                
                <div className="mb-2">
                  <h2 className="text-[10px] font-bold mb-1 text-gray-800">EXPERIENCE</h2>
                  <div className="text-[8px]">
                    <p className="font-semibold">Senior Software Engineer</p>
                    <p className="text-gray-600">TechCorp Inc.</p>
                  </div>
                </div>
                
                <div className="mb-2">
                  <h2 className="text-[10px] font-bold mb-1 text-gray-800">SKILLS</h2>
                  <div className="flex flex-wrap gap-1">
                    <span className="px-1 py-0.5 bg-blue-100 text-blue-800 text-[7px] rounded">React</span>
                    <span className="px-1 py-0.5 bg-blue-100 text-blue-800 text-[7px] rounded">Node.js</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};