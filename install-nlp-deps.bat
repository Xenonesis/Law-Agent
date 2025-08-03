@echo off
echo Installing NLP Dependencies...
cd backend

echo Activating virtual environment...
call venv\Scripts\activate

echo Installing core NLP packages...
pip install -r nlp_requirements.txt

echo Downloading spaCy model...
python -m spacy download en_core_web_sm

echo Installing NLTK data...
python -c "import nltk; nltk.download('punkt'); nltk.download('stopwords'); nltk.download('vader_lexicon')"

echo NLP dependencies installation complete!
pause