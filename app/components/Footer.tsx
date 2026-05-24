'use client';

import { Mail, MessageCircle, Send } from 'lucide-react';
import { useTranslation } from '@/app/i18n/useTranslation';

export default function Footer() {
  const { t } = useTranslation('common');
  return (
    <footer className="bg-gray-900 text-white py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-10">
          {/* Brand */}
          <div>
            <div className="flex items-center space-x-2 mb-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">B</span>
              </div>
              <span className="text-lg font-bold">BuildCalc AI</span>
            </div>
            <p className="text-sm text-gray-400 mb-3">
              {t('footer.description')}
            </p>
            <div className="flex space-x-3">
              <a href="#" className="w-9 h-9 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-blue-600 transition-colors duration-300">
                <Send className="w-4 h-4" />
              </a>
              <a href="#" className="w-9 h-9 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-blue-600 transition-colors duration-300">
                <MessageCircle className="w-4 h-4" />
              </a>
              <a href="#" className="w-9 h-9 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-blue-600 transition-colors duration-300">
                <Mail className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Product */}
          <div>
            <h3 className="text-sm font-semibold mb-3">{t('footer.product')}</h3>
            <ul className="space-y-2">
              <li>
                <a href="#features" className="text-sm text-gray-400 hover:text-white transition-colors duration-300">
                  {t('footer.features')}
                </a>
              </li>
              <li>
                <a href="#how-it-works" className="text-sm text-gray-400 hover:text-white transition-colors duration-300">
                  {t('footer.howItWorks')}
                </a>
              </li>
              <li>
                <a href="#materials" className="text-sm text-gray-400 hover:text-white transition-colors duration-300">
                  {t('footer.catalog')}
                </a>
              </li>
              <li>
                <a href="#" className="text-sm text-gray-400 hover:text-white transition-colors duration-300">
                  {t('footer.pricing')}
                </a>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="text-sm font-semibold mb-3">{t('footer.company')}</h3>
            <ul className="space-y-2">
              <li>
                <a href="#" className="text-sm text-gray-400 hover:text-white transition-colors duration-300">
                  {t('footer.about')}
                </a>
              </li>
              <li>
                <a href="#" className="text-sm text-gray-400 hover:text-white transition-colors duration-300">
                  {t('footer.blog')}
                </a>
              </li>
              <li>
                <a href="#" className="text-sm text-gray-400 hover:text-white transition-colors duration-300">
                  {t('footer.careers')}
                </a>
              </li>
              <li>
                <a href="#" className="text-sm text-gray-400 hover:text-white transition-colors duration-300">
                  {t('footer.contacts')}
                </a>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="text-sm font-semibold mb-3">{t('footer.support')}</h3>
            <ul className="space-y-2">
              <li>
                <a href="#faq" className="text-sm text-gray-400 hover:text-white transition-colors duration-300">
                  {t('footer.faq')}
                </a>
              </li>
              <li>
                <a href="#" className="text-sm text-gray-400 hover:text-white transition-colors duration-300">
                  {t('footer.docs')}
                </a>
              </li>
              <li>
                <a href="#" className="text-sm text-gray-400 hover:text-white transition-colors duration-300">
                  {t('footer.help')}
                </a>
              </li>
              <li>
                <a href="#" className="text-sm text-gray-400 hover:text-white transition-colors duration-300">
                  {t('footer.feedback')}
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="pt-6 border-t border-gray-800">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-3 md:space-y-0">
            <div className="text-gray-400 text-xs">
              {t('footer.copyright')}
            </div>
            <div className="flex space-x-5 text-xs">
              <a href="#" className="text-gray-400 hover:text-white transition-colors duration-300">
                {t('footer.privacy')}
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors duration-300">
                {t('footer.terms')}
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors duration-300">
                {t('footer.cookies')}
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
