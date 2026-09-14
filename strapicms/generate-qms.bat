@echo off
call npm run strapi generate api quran-program
call npm run strapi generate api quran-group
call npm run strapi generate api memorization
call npm run strapi generate api murajaah
call npm run strapi generate api tajweed-evaluation
call npm run strapi generate api halaqah
call npm run strapi generate api quran-attendance
call npm run strapi generate api quran-assessment
call npm run strapi generate api dawah-activity
call npm run strapi generate api quran-competition
call npm run strapi generate api quran-achievement
call npm run strapi generate api quran-certificate
echo Generation Complete!
