// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
/* eslint-disable */


// src/app/(public)/about/page.tsx
'use client';

import React, { useState } from 'react';

const AboutPage = () => {
    const [isTelugu, setIsTelugu] = useState(false);

    return (
        <div className="min-h-screen bg-gradient-to-b from-[#8B1A1A] via-[#C84037] to-[#E67E3A] text-white px-5 py-16">
            <div className="max-w-4xl mx-auto text-center">
                {/* Language Toggle */}
                <div className="flex justify-center mb-8">
                    <button
                        onClick={() => setIsTelugu(!isTelugu)}
                        className="px-6 py-3 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 text-white text-sm font-medium transition-all duration-300 flex items-center gap-3"
                    >
                        <span className={!isTelugu ? 'opacity-100 font-bold' : 'opacity-50'}>English</span>
                        <span className="text-white/50">|</span>
                        <span className={isTelugu ? 'opacity-100 font-bold' : 'opacity-50'}>తెలుగు</span>
                    </button>
                </div>

                <h1 className="text-4xl md:text-5xl font-bold mb-8 drop-shadow-lg">
                    {isTelugu ? 'యూత్ క్యాంప్ 2026 గూర్చి....' : 'About Youth Camp 2026'}
                </h1>

                {isTelugu ? (
                    <>
                        <p className="text-lg md:text-xl leading-relaxed mb-6 text-white/95">
                            క్రిస్టియన్ అసెంబ్లీస్‌కు చెందిన యస్ కా (YESCA) టీమ్, క్రీస్తు యేసు రక్షణ సువార్త ద్వారా నాశనమవుతున్న యువతను చేరుకోవాలనే భారంతో ఏర్పడిన ఉత్సాహభరితమైన యౌవన విశ్వాసుల బృందం. పెద్దలు దైవ జనులు డి. జాన్ గారి ప్రార్థనా మరియు ప్రోత్సాహంతో, సహోదరుడు డి. జాన్ మోజెస్ గారి హృదయంలో కలిగిన భారాన్ని బట్టి ప్రార్ధనాపూర్వకముగా ప్రారంభించబడినదే ఈ యస్ కా టీమ్.
                        </p>
                        <p className="text-lg md:text-xl leading-relaxed mb-6 text-white/95">
                            మొదటి యూత్ క్యాంప్ సరిగ్గా 31 సంవత్సరాల క్రితం (1994) నిర్వహించబడింది. సంవత్సరాలుగా, ఈ పరిచర్య వేలాది మంది యౌవన జీవితాలకు ఆశీర్వాదకరంగా ఉంది. వీరిలో చాలా మంది ఇప్పుడు ఈ పనిపై ఉన్న దేవుని సమృద్ధియైన కృపకు సజీవ సాక్షులుగా నిలబడ్డారు. దేవుడనుగ్రహించిన వినయపూర్వకమైన ఆరంభం నుండి, యస్ కా గణనీయంగా వృద్ధి చెందింది, 2025 యువజన శిబిరంలో 900 మందికి పైగా యువత వివిధ రాష్ట్రాల నుండి హాజరయ్యారు. ఈ పరిచర్య ద్వారా, గొప్ప ఆజ్ఞ (మత్తయి 28:19-20) ఒక్కొక్క ఆత్మ ద్వారా నెరవేర్చబడుతోంది.
                        </p>
                        <p className="text-lg md:text-xl leading-relaxed mb-6 text-white/95">
                            ప్రతి సంవత్సరం జనవరి సెలవుల సమయంలో యస్ కా &apos;యూత్ క్యాంప్&apos; అనే వార్షిక కార్యక్రమాన్ని నిర్వహిస్తుంది. క్యాంప్ తో పాటు, యౌవన విశ్వాసులు విశ్వాసంలో ఎదగడానికి మరియు దేవుణ్ణి సమర్థవంతంగా సేవించడానికి వారిని సిద్ధం చేయడానికి, ఈ టీమ్ యూత్ రిట్రీట్‌లు, విద్యార్థుల సమావేశాలు, ఫాలో-అప్ పరిచర్యలు మరియు నైపుణ్య అభివృద్ధి కార్యక్రమాలను కూడా నిర్వహిస్తుంది.
                        </p>
                        <p className="text-lg md:text-xl leading-relaxed mb-6 text-white/95">
                            పౌలు తిమోతికి గుర్తు చేసినట్లుగా, &quot;నీ యౌవనమునుబట్టి ఎవడును నిన్ను తృణీకరింపనియ్యకుము గాని, మాటలోను, ప్రవర్తనలోను, ప్రేమలోను, విశ్వాసములోను, పవిత్రతలోను, విశ్వాసులకు మాదిరిగా ఉండుము.&quot; (1 తిమోతి 4:12). అనే వాక్య సూచన యువత జీవితాల్లో కార్యసాధకం కావడానికి మరియు నిరీక్షణ అవసరమైన ఈ లోకంలో, యౌవనులు క్రీస్తు కోసం స్థిరంగా నిలబడటానికి మరియు ఆయన సాక్షులుగా ప్రకాశించడానికి శక్తినిస్తూ, ఈ పరిచర్య ఆ పిలుపును సాధించడానికి కృషి చేస్తుంది.
                        </p>
                        <p className="text-lg md:text-xl leading-relaxed text-white/95">
                            <strong className="text-yellow-300">&quot;సత్యం ద్వారా నిజమైన స్వేచ్ఛ&quot;</strong> అనే ప్రధాన అంశంతో 2026 యూత్ క్యాంప్ నిర్వహించబడబోతోంది. ఇందులో దేశ విదేశాల నుండి వచ్చే దైవ సేవకుల వాక్య సందేశాలతో పాటుగా మధుర సంగీతంతో పాటలు, ఆధ్యాత్మిక పోటీలు, గ్రూప్ డిస్కషన్స్, యోహాను సువార్త పై క్విజ్ మరియు యువతకు అవసరమైన అనేక కార్యక్రమాలతో క్యాంప్ జరుగబోతోంది.
                        </p>
                    </>
                ) : (
                    <>
                        <p className="text-lg md:text-xl leading-relaxed mb-6 text-white/95">
                            The Youth Evangelistic Soldiers of Christian Assemblies (YESCA) Team is a zealous group of young believers united by a profound burden to reach perishing youth with the saving Gospel of Jesus Christ. This ministry was prayerfully established, born from the burden laid upon the heart of Bro. D. John Moses, with the consistent prayer and encouragement of the elders and the man of God, D. John.
                        </p>
                        <p className="text-lg md:text-xl leading-relaxed mb-6 text-white/95">
                            The first Youth Camp was conducted exactly 31 years ago (1994). Over the years, this ministry has been a profound blessing to thousands of young lives, many of whom now stand as living testimonies to the abundant grace of God on this work. From its humble, God-given inception, YESCA has grown significantly, hosting over 900 youth from various states at the 2025 Youth Camp. Through this dedicated ministry, the Great Commission (Matthew 28:19-20) is being faithfully fulfilled, one soul at a time.
                        </p>
                        <p className="text-lg md:text-xl leading-relaxed mb-6 text-white/95">
                            YESCA organizes the annual &apos;Youth Camp&apos; event every January during the holiday season. Alongside the Camp, the team conducts Youth Retreats, Student Conferences, follow-up ministries, and skill development programs, all aimed at equipping young believers to grow in the faith and serve God effectively.
                        </p>
                        <p className="text-lg md:text-xl leading-relaxed mb-6 text-white/95">
                            This ministry strives to fulfill the instruction Paul gave to Timothy: &quot;Let no one despise your youth, but be an example to the believers in word, in conduct, in love, in faith, in purity&quot; (1 Timothy 4:12). By enabling the young to embody the counsel of this verse, YESCA empowers them to stand firm for Christ and shine as His vibrant witnesses in a world desperately in need of hope, thus realizing its divine calling.
                        </p>
                        <p className="text-lg md:text-xl leading-relaxed text-white/95">
                            The 2026 Youth Camp is set to be organized under the central theme: <strong className="text-yellow-300">&quot;True Freedom Through Truth.&quot;</strong> The Camp program will feature powerful Word messages from consecrated servants of God joining us from across the nation and abroad, alongside blessed musical Singing, spiritual competitions, group discussions, a Quiz based on the Gospel of John, and numerous other enriching activities vital for the growth of the youth.
                        </p>
                    </>
                )}
            </div>
        </div>
    );
};

export default AboutPage;
