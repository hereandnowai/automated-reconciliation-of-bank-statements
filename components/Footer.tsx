import React from 'react';
import { brand } from '../branding';
import { BlogIcon } from './icons/BlogIcon';
import { LinkedInIcon } from './icons/LinkedInIcon';
import { InstagramIcon } from './icons/InstagramIcon';
import { GithubIcon } from './icons/GithubIcon';
import { XIcon } from './icons/XIcon';
import { YoutubeIcon } from './icons/YoutubeIcon';


const SocialLink: React.FC<{ href: string; children: React.ReactNode }> = ({ href, children }) => (
    <a href={href} target="_blank" rel="noopener noreferrer" className="text-brand-subtext hover:text-brand-text transition-colors">
        {children}
    </a>
);

const Footer: React.FC = () => {
    return (
        <footer className="w-full bg-white mt-8 py-4 px-8 shadow-inner">
            <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center text-sm">
                <p className="text-brand-subtext mb-2 sm:mb-0">
                    Developed by Sakthi Kannan [ AI Products Engineering Team ]
                </p>
                <div className="flex items-center space-x-4">
                    <SocialLink href={brand.socialMedia.blog}><BlogIcon className="w-5 h-5" /></SocialLink>
                    <SocialLink href={brand.socialMedia.linkedin}><LinkedInIcon className="w-5 h-5" /></SocialLink>
                    <SocialLink href={brand.socialMedia.instagram}><InstagramIcon className="w-5 h-5" /></SocialLink>
                    <SocialLink href={brand.socialMedia.github}><GithubIcon className="w-5 h-5" /></SocialLink>
                    <SocialLink href={brand.socialMedia.x}><XIcon className="w-5 h-5" /></SocialLink>
                    <SocialLink href={brand.socialMedia.youtube}><YoutubeIcon className="w-5 h-5" /></SocialLink>
                </div>
            </div>
        </footer>
    );
};

export default Footer;