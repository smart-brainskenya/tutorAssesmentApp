#!/bin/bash
sed -i 's/<div className="flex flex-col justify-center items-center py-20 gap-4">/ /g' src/pages/admin/Analytics.tsx
sed -i 's/<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sbk-blue"><\/div>/<LoadingSpinner \/>/g' src/pages/admin/Analytics.tsx
sed -i 's/<\/div>/ /g' src/pages/admin/Analytics.tsx # this is too broad, lets do it in python to be safer
