'use client';

import React from 'react';
import { Instagram, Youtube, Camera, Clock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

const PhotoPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-purple-900 dark:to-blue-900 py-16 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Main Announcement Card */}
        <Card className="mb-12 shadow-2xl border-2 border-purple-200 dark:border-purple-700 overflow-hidden">
          <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-8 text-center">
            <Camera className="w-20 h-20 mx-auto mb-4 text-white animate-pulse" />
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Photo Gallery
            </h1>
          </div>
          <CardContent className="p-12 text-center">
            <div className="flex justify-center items-center gap-3 mb-6">
              <Clock className="w-8 h-8 text-purple-600 dark:text-purple-400" />
              <h2 className="text-3xl font-semibold text-gray-800 dark:text-gray-200">
                Coming Soon!
              </h2>
            </div>
            <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 mb-4">
              Photos will be available here in
            </p>
            <div className="inline-block bg-gradient-to-r from-purple-600 to-blue-600 text-white px-8 py-4 rounded-full text-3xl md:text-4xl font-bold shadow-lg">
              2 Days
            </div>
            <p className="mt-6 text-gray-500 dark:text-gray-400">
              Stay tuned for amazing memories from our events!
            </p>
          </CardContent>
        </Card>

        {/* Social Media Section */}
        <div className="space-y-8">
          {/* CBA Social Media */}
          <Card className="shadow-xl hover:shadow-2xl transition-all duration-300 border-2 border-blue-200 dark:border-blue-700">
            <CardContent className="p-8">
              <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-6 text-center">
                Christian Brethren Assemblies Social Media
              </h3>
              <div className="grid md:grid-cols-2 gap-6">
                {/* YouTube Link */}
                <a
                  href="https://www.youtube.com/@ChristianBrethrenAssemblies"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group"
                >
                  <div className="flex items-center gap-4 p-6 bg-red-50 dark:bg-red-950 rounded-xl hover:bg-red-100 dark:hover:bg-red-900 transition-all duration-300 transform hover:scale-105 cursor-pointer border-2 border-red-200 dark:border-red-800">
                    <div className="bg-red-600 p-4 rounded-full group-hover:animate-pulse">
                      <Youtube className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800 dark:text-gray-200 text-lg">
                        YouTube Channel
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        @ChristianBrethrenAssemblies
                      </p>
                    </div>
                  </div>
                </a>

                {/* Instagram Link */}
                <a
                  href="https://www.instagram.com/cba.india"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group"
                >
                  <div className="flex items-center gap-4 p-6 bg-pink-50 dark:bg-pink-950 rounded-xl hover:bg-pink-100 dark:hover:bg-pink-900 transition-all duration-300 transform hover:scale-105 cursor-pointer border-2 border-pink-200 dark:border-pink-800">
                    <div className="bg-gradient-to-br from-purple-600 via-pink-600 to-orange-600 p-4 rounded-full group-hover:animate-pulse">
                      <Instagram className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800 dark:text-gray-200 text-lg">
                        Instagram
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        @cba.india
                      </p>
                    </div>
                  </div>
                </a>
              </div>
            </CardContent>
          </Card>

          {/* YESCA Instagram */}
          <Card className="shadow-xl hover:shadow-2xl transition-all duration-300 border-2 border-purple-200 dark:border-purple-700">
            <CardContent className="p-8">
              <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-6 text-center">
                YESCA Instagram
              </h3>
              <a
                href="https://www.instagram.com/yesca_team"
                target="_blank"
                rel="noopener noreferrer"
                className="group block"
              >
                <div className="flex items-center justify-center gap-4 p-8 bg-gradient-to-r from-purple-50 via-pink-50 to-orange-50 dark:from-purple-950 dark:via-pink-950 dark:to-orange-950 rounded-xl hover:from-purple-100 hover:via-pink-100 hover:to-orange-100 dark:hover:from-purple-900 dark:hover:via-pink-900 dark:hover:to-orange-900 transition-all duration-300 transform hover:scale-105 cursor-pointer border-2 border-purple-200 dark:border-purple-800">
                  <div className="bg-gradient-to-br from-purple-600 via-pink-600 to-orange-600 p-6 rounded-full group-hover:animate-pulse">
                    <Instagram className="w-10 h-10 text-white" />
                  </div>
                  <div className="text-center">
                    <p className="font-bold text-gray-800 dark:text-gray-200 text-2xl">
                      Follow YESCA Team
                    </p>
                    <p className="text-lg text-gray-600 dark:text-gray-400">
                      @yesca_team
                    </p>
                  </div>
                </div>
              </a>
            </CardContent>
          </Card>
        </div>

        {/* Footer Message */}
        <div className="mt-12 text-center">
          <p className="text-gray-600 dark:text-gray-400 text-lg">
            Follow us on social media to stay updated with the latest events and photos!
          </p>
        </div>
      </div>
    </div>
  );
};

export default PhotoPage;
