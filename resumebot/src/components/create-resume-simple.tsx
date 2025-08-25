"use client";
import { motion } from "motion/react";
import { useNavigate } from "react-router-dom";
import { Button } from "./button";
import { Navbar } from "./navbar";

interface Template {
  id: string;
  name: string;
  price: number;
  isFree: boolean;
}

export const CreateResumeSimple = () => {
  const navigate = useNavigate();

  const handleTemplateSelect = (template: Template) => {
    if (template.isFree || window.confirm(`This template costs $${template.price}. Continue?`)) {
      // For Deedy template, redirect to live builder
      if (template.id === 'deedy') {
        navigate('/live-builder/deedy');
      } else {
        navigate(`/build/${template.id}`);
      }
    }
  };

  const templates: Template[] = [
    { id: 'deedy', name: 'Deedy Resume', price: 0, isFree: true },
    { id: 'yuan', name: 'Yuan Professional', price: 12, isFree: false },
    { id: 'product-manager', name: 'Senior Product Manager', price: 14, isFree: false }
  ];

  return (
    <div className="min-h-screen bg-black">
      <Navbar />
      <div className="pt-24 pb-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-white mb-4">
              Choose Your Resume Template
            </h2>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto">
              Select from our professionally designed templates
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {templates.map((template, index) => (
              <motion.div
                key={template.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="relative bg-slate-800/50 rounded-xl overflow-hidden cursor-pointer"
                onClick={() => handleTemplateSelect(template)}
              >
                <div className="absolute top-4 left-4 z-10 bg-green-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                  {template.isFree ? 'FREE' : `$${template.price}`}
                </div>

                <div className="aspect-[3/4] bg-white border-2 border-slate-300 rounded-lg relative overflow-hidden">
                  {template.id === 'deedy' ? (
                    <div className="w-full h-full bg-white text-black p-3 text-[7px] leading-tight" 
                         style={{fontFamily: 'Lato, "Helvetica Neue", Helvetica, Arial, sans-serif'}}>
                      
                      {/* Header */}
                      <div className="text-center mb-2">
                        <div className="text-right text-[7px] text-gray-400 mb-1">
                          Last Updated on {new Date().toLocaleDateString()}
                        </div>
                        <h1 className="text-[14px] font-light tracking-wide mb-1">
                          <span className="text-gray-600 font-extralight">DEBARGHYA</span>{' '}
                          <span className="text-black font-normal">DAS</span>
                        </h1>
                        <div className="text-[7px] text-gray-600 border-b border-gray-300 pb-1">
                          debarghyadas.com | dd367@cornell.edu | 607.379.5733
                        </div>
                      </div>

                      {/* Two columns */}
                      <div className="flex gap-2 text-[7px]">
                        {/* Left Column */}
                        <div className="w-1/3">
                          <div className="mb-2">
                            <h2 className="text-[7px] font-light text-gray-500 uppercase tracking-wide mb-1">Education</h2>
                            <div className="mb-1">
                              <div className="font-semibold uppercase text-[7px]">Cornell University</div>
                              <div className="text-gray-700 text-[7px]">MEng in Computer Science</div>
                              <div className="text-gray-500 text-[6px]">Expected Dec 2014</div>
                              <div className="text-gray-500 text-[6px]">Ithaca, NY</div>
                            </div>
                            <div className="mb-1">
                              <div className="font-semibold uppercase text-[7px]">Cornell University</div>
                              <div className="text-gray-700 text-[7px]">BS in Computer Science</div>
                              <div className="text-gray-700 text-[7px]">Conc. in Software Engineering</div>
                              <div className="text-gray-500 text-[6px]">Expected May 2014</div>
                              <div className="text-gray-500 text-[6px]">Dean's List (All Semesters)</div>
                            </div>
                            <div>
                              <div className="font-semibold uppercase text-[7px]">La Martiniere for Boys</div>
                              <div className="text-gray-500 text-[6px]">Class of 2011</div>
                            </div>
                          </div>

                          <div className="mb-2">
                            <h2 className="text-[7px] font-light text-gray-500 uppercase tracking-wide mb-1">Links</h2>
                            <div className="text-[6px] text-gray-600 leading-tight space-y-0.5">
                              <div>Facebook:// <span className="font-semibold">dd367</span></div>
                              <div>GitHub:// <span className="font-semibold">deedy</span></div>
                              <div>LinkedIn:// <span className="font-semibold">debarghyadas</span></div>
                              <div>YouTube:// <span className="font-semibold">DebarghyaDas</span></div>
                              <div>Twitter:// <span className="font-semibold">@debarghya_das</span></div>
                            </div>
                          </div>

                          <div className="mb-2">
                            <h2 className="text-[7px] font-light text-gray-500 uppercase tracking-wide mb-1">Coursework</h2>
                            <div className="text-[6px] text-gray-600 leading-tight">
                              <div className="mb-1">
                                <div className="font-semibold">Graduate</div>
                                <div>Advanced Machine Learning</div>
                                <div>Open Source Software Engineering</div>
                                <div>Advanced Interactive Graphics</div>
                                <div>Data Mining • Computer Vision</div>
                              </div>
                              <div>
                                <div className="font-semibold">Undergraduate</div>
                                <div>Information Retrieval</div>
                                <div>Machine Learning</div>
                                <div>Computer Graphics • Computer Vision</div>
                                <div>Artificial Intelligence • Robotics</div>
                                <div>Image Processing</div>
                                <div>Computational Photography</div>
                              </div>
                            </div>
                          </div>

                          <div className="mb-2">
                            <h2 className="text-[7px] font-light text-gray-500 uppercase tracking-wide mb-1">Skills</h2>
                            <div>
                              <div className="font-semibold text-[7px] mb-0.5">Programming</div>
                              <div className="text-[6px] text-gray-600 leading-tight">
                                <div><span className="font-semibold">Over 5000 lines:</span></div>
                                <div>Java • Shell • Python • Javascript</div>
                                <div>OCaml • Matlab • Rails • LaTeX</div>
                                <div className="mt-0.5"><span className="font-semibold">Over 1000 lines:</span></div>
                                <div>C • C++ • CSS • PHP • Assembly</div>
                                <div className="mt-0.5"><span className="font-semibold">Familiar:</span></div>
                                <div>AS3 • iOS • Android • MySQL</div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Right Column */}
                        <div className="flex-1">
                          <div className="mb-2">
                            <h2 className="text-[7px] font-light text-gray-500 uppercase tracking-wide mb-1">Experience</h2>
                            
                            <div className="mb-1">
                              <div className="flex justify-between items-baseline">
                                <div>
                                  <span className="font-semibold uppercase text-[7px]">Facebook</span>
                                  <span className="text-gray-700 text-[7px]"> | Software Engineer</span>
                                </div>
                                <span className="text-[6px] text-gray-500">June 2014 – Sept 2014</span>
                              </div>
                              <div className="text-[6px] text-gray-500 italic">Menlo Park, CA</div>
                              <div className="text-[6px] text-gray-600 leading-tight mt-0.5">
                                • 52 out of 2500 applicants chosen to be a KPCB Fellow 2014.
                                <br />• Led and shipped Yoda - admin interface for new Phoenix platform.
                                <br />• Full-stack developer - Wrote and reviewed code for JS using React, PHP using Hack.
                                <br />• Saw pm/engineering trade-offs, presented the case for engineering.
                              </div>
                            </div>

                            <div className="mb-1">
                              <div className="flex justify-between items-baseline">
                                <div>
                                  <span className="font-semibold uppercase text-[6px]">Coursera</span>
                                  <span className="text-gray-700 text-[6px]"> | KPCB Fellow + SWE Intern</span>
                                </div>
                                <span className="text-[6px] text-gray-500">June 2014 – Sept 2014</span>
                              </div>
                              <div className="text-[6px] text-gray-500 italic">Mountain View, CA</div>
                              <div className="text-[6px] text-gray-600 leading-tight mt-0.5">
                                • Led and shipped Yoda - admin interface for new Phoenix platform.
                                <br />• Full-stack developer - Wrote and reviewed code for JS using React, PHP using Hack.
                              </div>
                            </div>

                            <div className="mb-1">
                              <div className="flex justify-between items-baseline">
                                <div>
                                  <span className="font-semibold uppercase text-[6px]">Google</span>
                                  <span className="text-gray-700 text-[6px]"> | Software Engineering Intern</span>
                                </div>
                                <span className="text-[6px] text-gray-500">May 2013 – Aug 2013</span>
                              </div>
                              <div className="text-[6px] text-gray-500 italic">Mountain View, CA</div>
                              <div className="text-[6px] text-gray-600 leading-tight mt-0.5">
                                • Worked on YouTube Captions team, in Javascript and Python to plan, to design and develop the full stack to create a GUI to launch a new product.
                                <br />• Scripted Selenium tests to test an autogen tool to run regression tests.
                              </div>
                            </div>

                            <div>
                              <div className="flex justify-between items-baseline">
                                <div>
                                  <span className="font-semibold uppercase text-[6px]">Phabricator</span>
                                  <span className="text-gray-700 text-[6px]"> | Open Source Contributor</span>
                                </div>
                                <span className="text-[6px] text-gray-500">Jan 2013 – May 2013</span>
                              </div>
                              <div className="text-[6px] text-gray-500 italic">Palo Alto, CA & Ithaca, NY</div>
                              <div className="text-[6px] text-gray-600 leading-tight mt-0.5">
                                • Phabricator is used daily by Facebook, Dropbox, Quora, Asana and more.
                                <br />• I created the Meme generator and more in PHP and Shell.
                                <br />• The meme generator is featured on the Facebook page.
                              </div>
                            </div>
                          </div>

                          <div className="mb-2">
                            <h2 className="text-[7px] font-light text-gray-500 uppercase tracking-wide mb-1">Research</h2>
                            
                            <div className="mb-1">
                              <div className="flex justify-between items-baseline">
                                <div>
                                  <span className="font-semibold uppercase text-[6px]">Cornell Robot Learning Lab</span>
                                  <span className="text-gray-700 text-[6px]"> | Head Undergrad Research</span>
                                </div>
                                <span className="text-[6px] text-gray-500">Jan 2014 – Jan 2015</span>
                              </div>
                              <div className="text-[6px] text-gray-500 italic">Ithaca, NY</div>
                              <div className="text-[6px] text-gray-600 leading-tight mt-0.5">
                                Worked with Prof Ashesh Jain and Prof Ashutosh Saxena to create PlanIt, a tool which learns from large scale user preference feedback to plan robot trajectories in human environments.
                              </div>
                            </div>

                            <div className="mb-1">
                              <div className="flex justify-between items-baseline">
                                <div>
                                  <span className="font-semibold uppercase text-[6px]">Cornell University</span>
                                  <span className="text-gray-700 text-[6px]"> | MEng Thesis Research</span>
                                </div>
                                <span className="text-[6px] text-gray-500">Aug 2014 – Dec 2014</span>
                              </div>
                              <div className="text-[6px] text-gray-500 italic">Ithaca, NY</div>
                              <div className="text-[6px] text-gray-600 leading-tight mt-0.5">
                                Data mining project in collaboration with faculty to create new algorithm for parsing data.
                              </div>
                            </div>

                            <div>
                              <div className="flex justify-between items-baseline">
                                <div>
                                  <span className="font-semibold uppercase text-[6px]">Startup Benchmark</span>
                                  <span className="text-gray-700 text-[6px]"> | Research Assistant</span>
                                </div>
                                <span className="text-[6px] text-gray-500">Jan 2013 – Jan 2014</span>
                              </div>
                              <div className="text-[6px] text-gray-500 italic">Ithaca, NY</div>
                              <div className="text-[6px] text-gray-600 leading-tight mt-0.5">
                                Collected and analyzed information on over 25 companies to create a database template on which faculty would base research projects and data analysis.
                              </div>
                            </div>
                          </div>

                          <div className="mb-2">
                            <h2 className="text-[7px] font-light text-gray-500 uppercase tracking-wide mb-1">Awards</h2>
                            <div className="text-[6px] text-gray-600 leading-tight space-y-0.5">
                              <div className="flex">
                                <span className="w-8">2014</span>
                                <span>top 52/2500 KPCB Engineering Fellow ($18k)</span>
                              </div>
                              <div className="flex">
                                <span className="w-8">2014</span>
                                <span>1st/50 Microsoft Coding Competition, Cornell</span>
                              </div>
                              <div className="flex">
                                <span className="w-8">2013</span>
                                <span>National Jump Trading Challenge Finalist</span>
                              </div>
                              <div className="flex">
                                <span className="w-8">2013</span>
                                <span>VMware Scholarship Recipient</span>
                              </div>
                              <div className="flex">
                                <span className="w-8">2012</span>
                                <span>2nd Place in Cornell Biohackathon</span>
                              </div>
                              <div className="flex">
                                <span className="w-8">2011</span>
                                <span>1st/300 Volunteer Service Award, Pune</span>
                              </div>
                              <div className="flex">
                                <span className="w-8">2011</span>
                                <span>7th/120000 Agrawal Scholarship</span>
                              </div>
                              <div className="flex">
                                <span className="w-8">2011</span>
                                <span>National Merit Scholarship</span>
                              </div>
                            </div>
                          </div>

                          <div>
                            <h2 className="text-[7px] font-light text-gray-500 uppercase tracking-wide mb-1">Publications</h2>
                            <div className="text-[6px] text-gray-600 leading-tight space-y-1">
                              <div>
                                Purushottam Kar and <span className="font-semibold">Debarghya Das</span>. "Finite Sample Analysis of the GTD Policy Evaluation Algorithms in Markov Decision Processes". AAMAS 2015.
                              </div>
                              <div>
                                Purushottam Kar and <span className="font-semibold">Debarghya Das</span>. "Finite Sample Convergence Rates of Zero-Order Stochastic Optimization Methods". NIPS 2013.
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : template.id === 'yuan' ? (
                    <div className="w-full h-full bg-white p-3 pt-6 text-black text-[9px] leading-tight">
                      {/* Header - Name with Ph.D. and Contact info */}
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-baseline gap-2">
                          <h1 className="text-[15px] font-bold tracking-widest uppercase">XIAO YUAN</h1>
                          <span className="text-[11px] font-bold">PH.D.</span>
                        </div>
                        <div className="text-right text-[8px] text-black space-y-0.5">
                          <div>(+00) 111-2222-3333</div>
                          <div>yuanhf@example.com</div>
                          <div>http://www.example.com</div>
                        </div>
                      </div>

                      {/* Horizontal separator line */}
                      <div className="border-b border-gray-400 mb-3"></div>

                      {/* Two-column layout with sidebar headings */}
                      <div className="space-y-2">
                        {/* Education */}
                        <div className="flex">
                          <div className="w-24 flex-shrink-0">
                            <h2 className="text-[8px] font-bold uppercase tracking-wide">EDUCATION</h2>
                          </div>
                          <div className="flex-1 space-y-1">
                            <div className="flex justify-between">
                              <div>
                                <div className="font-bold text-[7px]">University of Notre Dame</div>
                                <div className="text-[6px] italic">Ph.D., Computer Science and Engineering, GPA 4.0/4.0</div>
                                <div className="text-[6px]">Dissertation: Representing Big Data as Networks: New Methods and Insights</div>
                                <div className="text-[6px]">Advisor: Dr. Nitesh V. Chawla</div>
                              </div>
                              <div className="text-right text-[6px]">
                                <div>Notre Dame, IN, USA</div>
                                <div>2017</div>
                              </div>
                            </div>
                            <div className="flex justify-between">
                              <div>
                                <div className="font-bold text-[7px]">Fudan University</div>
                                <div className="text-[6px] italic">B. Sc., Electronics Engineering</div>
                              </div>
                              <div className="text-right text-[6px]">
                                <div>Shanghai, China</div>
                                <div>2012</div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Publications */}
                        <div className="flex">
                          <div className="w-24 flex-shrink-0">
                            <h2 className="text-[7px] font-bold uppercase tracking-wide">PUBLICATIONS</h2>
                          </div>
                          <div className="flex-1 text-[5px] space-y-1">
                            <div>1. <span className="font-bold">J. Xu</span>, T. L. Wickramarathne, and N. V. Chawla. <span className="italic">Representing higher-order dependencies in networks</span>. Science Advances, 2(5):e1600028, 2016. (In the top 5% of all research outputs scored by Altmetric, 97th percentile attention score compared to outputs of the same age, featured in 8 news outlets. Journal impact factor 11.5)</div>
                            <div>2. M. Saebi, <span className="font-bold">J. Xu</span>, L. M. Kaplan, B. Ribeiro, and N. V. Chawla. <span className="italic">Efficient modeling of higher-order dependencies in networks: from algorithm to application for anomaly detection</span>. EPJ Data Science, 9(1):1–22, 2020</div>
                            <div>3. <span className="font-bold">J. Xu</span>, T. L. Wickramarathne, N. V. Chawla, E. K. Grey, K. Steinhaeuser, R. P. Keller, J. M. Drake, and D. M. Lodge. <span className="italic">Improving management of aquatic invasions by integrating shipping network, ecological, and environmental data: Data mining for social good</span>. In Proceedings of the 20th ACM SIGKDD international conference on Knowledge discovery and data mining (KDD), pages 1699–1708. ACM, 2014. (Acc. rate: 15%)</div>
                            <div>4. Y. Dong, R. A. Johnson, <span className="font-bold">J. Xu</span>, and N. V. Chawla. <span className="italic">Structural diversity and homophily: a study across more than one hundred big networks</span>. In Proceedings of the 23rd ACM SIGKDD international conference on Knowledge discovery and data mining (KDD). ACM, 2017. (Acc. rate: 17%).</div>
                            <div>5. M. Saebi, <span className="font-bold">J. Xu</span>, S. R. Curasi, E. K. Grey, N. V. Chawla, and D. M. Lodge. <span className="italic">Network analysis of ballast-mediated species transfer reveals important introduction and dispersal patterns in the arctic</span>. Scientific reports, 10(1):1–15, 2020</div>
                          </div>
                        </div>

                        {/* Projects */}
                        <div className="flex">
                          <div className="w-24 flex-shrink-0">
                            <h2 className="text-[7px] font-bold uppercase tracking-wide">PROJECTS</h2>
                          </div>
                          <div className="flex-1 space-y-1">
                            <div className="flex justify-between">
                              <div>
                                <div className="font-bold text-[6px]">Advanced Optimization Techniques for Smart Grid Management</div>
                                <div className="text-[6px] italic">National Natural Science Foundation of China (NSFC)</div>
                              </div>
                              <div className="text-[6px]">2023.01- 2024.01</div>
                            </div>
                            <div className="flex justify-between">
                              <div>
                                <div className="font-bold text-[6px]">Optimizing Urban Traffic Flow Using AI-Based Predictive Models</div>
                                <div className="text-[6px] italic">Smart Transportation Innovations Grant</div>
                              </div>
                              <div className="text-[6px]">2024.01- 2024.06</div>
                            </div>
                          </div>
                        </div>

                        {/* Internships */}
                        <div className="flex">
                          <div className="w-24 flex-shrink-0">
                            <h2 className="text-[7px] font-bold uppercase tracking-wide">INTERNSHIPS</h2>
                          </div>
                          <div className="flex-1 space-y-1">
                            <div className="flex justify-between">
                              <div>
                                <div className="font-bold text-[6px]">ABCTech Ltd.</div>
                                <div className="text-[6px]">• Develop engaging content for social media platforms</div>
                                <div className="text-[6px]">• Prepare reports and presentations summarizing research findings</div>
                              </div>
                              <div className="text-right text-[6px]">
                                <div>Shanghai, China</div>
                                <div>2023.07- 2023.12</div>
                              </div>
                            </div>
                            <div className="flex justify-between">
                              <div>
                                <div className="font-bold text-[6px]">XYZTech Inc.</div>
                                <div className="text-[6px]">• Develop engaging content for social media platforms</div>
                              </div>
                              <div className="text-right text-[6px]">
                                <div>Shanghai, China</div>
                                <div>2021.12- 2022.12</div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Awards and Honors */}
                        <div className="flex">
                          <div className="w-24 flex-shrink-0">
                            <h2 className="text-[7px] font-bold uppercase tracking-wide">AWARDS</h2>
                          </div>
                          <div className="flex-1 text-[6px] space-y-0.5">
                            <div>• <span className="font-bold">First Prize</span>, International Data Science Challenge (2023)</div>
                            <div>• <span className="font-bold">Best Innovation Award</span>, Tech Startup (2023)</div>
                          </div>
                        </div>

                        {/* Skills */}
                        <div className="flex">
                          <div className="w-24 flex-shrink-0">
                            <h2 className="text-[7px] font-bold uppercase tracking-wide">SKILLS</h2>
                          </div>
                          <div className="flex-1 text-[5px] space-y-1">
                            <div><span className="font-bold">Programming:</span> Python and SQL for data mining; C# for graphical interface; C and Common Lisp for high performance computing.</div>
                            <div><span className="font-bold">Big data:</span> Snowflake, BigQuery, Vertica, and Spark for trillion-scale database queries; Airflow and Linux shell scripts for managing parallelized jobs on Amazon S3 and distributed systems.</div>
                            <div><span className="font-bold">Tools:</span> Tableau and Gephi for visualization; Bloomberg Terminal for trading; ArcGIS for geographical information system; NetworkX for network analysis; Javascript and Flask for web app development; Requests and Selenium for web scraping</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : template.id === 'product-manager' ? (
                    <div className="w-full h-full bg-white text-black text-[11px] leading-[1.5] flex" style={{fontFamily: 'system-ui, -apple-system, "Helvetica Neue", sans-serif'}}>
                      {/* Left Column - Sidebar (~30% width, light green background) */}
                      <div className="w-[30%] bg-emerald-50 px-5 py-6">
                        {/* Header Section with extra padding */}
                        <div className="mb-6">
                          <h1 className="text-[16px] font-bold text-gray-900 mb-2 mt-3 tracking-wide">BRIAN T. WAYNE</h1>
                          <p className="text-[9px] italic text-gray-600 mb-4 font-medium">Senior Product Manager</p>
                          {/* Horizontal line separator */}
                          <div className="border-b-2 border-gray-300 mb-5"></div>
                        </div>

                        {/* Contact Information */}
                        <div className="mb-6">
                          <div className="space-y-2.5">
                            <div className="flex items-center text-[8px] text-gray-700">
                              <span className="text-emerald-600 font-semibold w-4 flex-shrink-0">✉</span>
                              <span className="break-all">brian.wayne@email.com</span>
                            </div>
                            <div className="flex items-center text-[8px] text-gray-700">
                              <span className="text-emerald-600 font-semibold w-4 flex-shrink-0">📞</span>
                              <span>(555) 123-4567</span>
                            </div>
                            <div className="flex items-center text-[8px] text-gray-700">
                              <span className="text-emerald-600 font-semibold w-4 flex-shrink-0">📍</span>
                              <span>New York, NY</span>
                            </div>
                            <div className="flex items-center text-[8px] text-gray-700">
                              <span className="text-emerald-600 font-semibold w-4 flex-shrink-0">💼</span>
                              <span className="break-all">in/brianwayne</span>
                            </div>
                            <div className="flex items-center text-[8px] text-gray-700">
                              <span className="text-emerald-600 font-semibold w-4 flex-shrink-0">🌐</span>
                              <span>brianwayne.com</span>
                            </div>
                          </div>
                        </div>

                        {/* Profile Section */}
                        <div className="mb-6">
                          <h2 className="text-[10px] font-bold text-emerald-800 mb-2 uppercase tracking-wider">PROFILE</h2>
                          <div className="border-b border-emerald-300 mb-3"></div>
                          <p className="text-[8px] text-gray-800 leading-[1.6] text-justify font-medium">
                            Results-driven Senior Product Manager with 8+ years of experience leading cross-functional teams to deliver innovative products. Proven track record of driving product strategy, user adoption, and revenue growth across diverse technology platforms.
                          </p>
                        </div>

                        {/* Education Section */}
                        <div className="mb-6">
                          <h2 className="text-[10px] font-bold text-emerald-800 mb-2 uppercase tracking-wider">EDUCATION</h2>
                          <div className="border-b border-emerald-300 mb-3"></div>
                          <div className="space-y-3.5">
                            <div>
                              <div className="flex justify-between items-start">
                                <div>
                                  <p className="font-bold text-[8px] text-gray-900">MBA in Business Strategy</p>
                                  <p className="text-[8px] italic text-gray-600 mt-0.5">Harvard Business School</p>
                                </div>
                                <span className="text-[7px] text-gray-500 font-semibold">2018</span>
                              </div>
                            </div>
                            <div>
                              <div className="flex justify-between items-start">
                                <div>
                                  <p className="font-bold text-[8px] text-gray-900">BA in Economics</p>
                                  <p className="text-[8px] italic text-gray-600 mt-0.5">Yale University</p>
                                </div>
                                <span className="text-[7px] text-gray-500 font-semibold">2014</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Languages Section */}
                        <div>
                          <h2 className="text-[10px] font-bold text-emerald-800 mb-2 uppercase tracking-wider">LANGUAGES</h2>
                          <div className="border-b border-emerald-300 mb-3"></div>
                          <div className="text-[8px] text-gray-800 space-y-1.5 leading-[1.6]">
                            <p className="flex items-center gap-2"><span className="text-emerald-600">•</span> English (Native)</p>
                            <p className="flex items-center gap-2"><span className="text-emerald-600">•</span> Spanish (Fluent)</p>
                            <p className="flex items-center gap-2"><span className="text-emerald-600">•</span> French (Conversational)</p>
                          </div>
                        </div>
                      </div>

                      {/* Right Column - Main Content (~70% width, white background) */}
                      <div className="w-[70%] px-6 py-6">
                        {/* Professional Experience Section */}
                        <div className="mb-7">
                          <h2 className="text-[12px] font-bold text-emerald-800 mb-2 uppercase tracking-wider">PROFESSIONAL EXPERIENCE</h2>
                          <div className="border-b-2 border-emerald-300 mb-4"></div>
                          <div className="space-y-5">
                            <div>
                              <div className="flex justify-between items-start mb-2">
                                <div>
                                  <h3 className="font-bold text-[9px] text-gray-900 mb-0.5">Senior Product Manager</h3>
                                  <p className="text-[8px] text-emerald-700 font-semibold">TechCorp Solutions</p>
                                </div>
                                <div className="text-right text-[8px] text-gray-600">
                                  <p className="font-semibold">2021 — Present</p>
                                  <p className="text-gray-500">San Francisco, CA</p>
                                </div>
                              </div>
                              <ul className="text-[8px] text-gray-800 space-y-1.5 leading-[1.6] ml-4">
                                <li className="flex items-start gap-2"><span className="text-emerald-600 font-bold">•</span> Led product strategy for mobile app platform, driving 40% increase in user engagement</li>
                                <li className="flex items-start gap-2"><span className="text-emerald-600 font-bold">•</span> Managed product roadmap and cross-functional team of 15+ engineers and designers</li>
                                <li className="flex items-start gap-2"><span className="text-emerald-600 font-bold">•</span> Launched 3 major product features resulting in $2M additional annual recurring revenue</li>
                              </ul>
                            </div>

                            <div>
                              <div className="flex justify-between items-start mb-2">
                                <div>
                                  <h3 className="font-bold text-[9px] text-gray-900 mb-0.5">Product Manager</h3>
                                  <p className="text-[8px] text-emerald-700 font-semibold">Growth Partners LLC</p>
                                </div>
                                <div className="text-right text-[8px] text-gray-600">
                                  <p className="font-semibold">2018 — 2021</p>
                                  <p className="text-gray-500">New York, NY</p>
                                </div>
                              </div>
                              <ul className="text-[8px] text-gray-800 space-y-1.5 leading-[1.6] ml-4">
                                <li className="flex items-start gap-2"><span className="text-emerald-600 font-bold">•</span> Owned product roadmap for B2B SaaS platform serving 50K+ monthly active users</li>
                                <li className="flex items-start gap-2"><span className="text-emerald-600 font-bold">•</span> Increased user retention by 25% through data-driven feature optimization</li>
                                <li className="flex items-start gap-2"><span className="text-emerald-600 font-bold">•</span> Collaborated with engineering and design teams to deliver 12+ product releases</li>
                              </ul>
                            </div>
                          </div>
                        </div>

                        {/* Skills Section */}
                        <div className="mb-7">
                          <h2 className="text-[12px] font-bold text-emerald-800 mb-2 uppercase tracking-wider">SKILLS</h2>
                          <div className="border-b-2 border-emerald-300 mb-4"></div>
                          <ul className="text-[8px] text-gray-800 space-y-2 leading-[1.6] ml-4">
                            <li className="flex items-start gap-2"><span className="text-emerald-600 font-bold">•</span> Product Strategy & Roadmap Planning</li>
                            <li className="flex items-start gap-2"><span className="text-emerald-600 font-bold">•</span> Cross-functional Team Leadership & Agile Methodology</li>
                            <li className="flex items-start gap-2"><span className="text-emerald-600 font-bold">•</span> User Research & Data-Driven Decision Making</li>
                            <li className="flex items-start gap-2"><span className="text-emerald-600 font-bold">•</span> A/B Testing & Product Analytics</li>
                            <li className="flex items-start gap-2"><span className="text-emerald-600 font-bold">•</span> Go-to-Market Strategy & Product Launch</li>
                          </ul>
                        </div>

                        {/* Awards Section */}
                        <div>
                          <h2 className="text-[12px] font-bold text-emerald-800 mb-2 uppercase tracking-wider">AWARDS & RECOGNITION</h2>
                          <div className="border-b-2 border-emerald-300 mb-4"></div>
                          <div className="space-y-3.5">
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="font-bold text-[8px] text-gray-900">Top Performer Award</p>
                                <p className="text-[8px] italic text-gray-600 mt-0.5">TechCorp Solutions</p>
                                <p className="text-[7px] text-gray-500 mt-0.5">Recognized for exceeding annual targets by 150%</p>
                              </div>
                              <span className="text-[7px] text-gray-500 font-semibold">2023</span>
                            </div>
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="font-bold text-[8px] text-gray-900">Excellence in Business Development</p>
                                <p className="text-[8px] italic text-gray-600 mt-0.5">Growth Partners LLC</p>
                                <p className="text-[7px] text-gray-500 mt-0.5">Outstanding achievement in new market penetration</p>
                              </div>
                              <span className="text-[7px] text-gray-500 font-semibold">2020</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-purple-100 to-pink-100 p-2 text-black text-[8px]">
                      <div className="text-center mb-2">
                        <h1 className="text-[10px] font-bold text-purple-800">TEMPLATE PREVIEW</h1>
                        <p className="text-purple-600 text-[7px]">Coming Soon</p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="p-6">
                  <h3 className="text-xl font-bold text-white mb-2">{template.name}</h3>
                  <p className="text-slate-400 text-sm mb-4">
                    {template.id === 'deedy' ? 'Classic two-column template for CS students' :
                     template.id === 'yuan' ? 'An Elegant English Resume' :
                     template.id === 'product-manager' ? 'Professional product manager template' :
                     'Eye-catching template for creative professionals'}
                  </p>
                  <Button className="w-full" variant={template.isFree ? "default" : "outline"}>
                    {template.isFree ? `Use ${template.name}` : `Use Template - $${template.price}`}
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="text-center mt-12">
            <p className="text-slate-400 mb-4">Select a template to continue with AI resume generation</p>
            <Button size="lg" variant="outline">
              Back to Home
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};