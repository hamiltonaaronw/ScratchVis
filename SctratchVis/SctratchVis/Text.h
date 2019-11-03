#pragma once

//#include <ft2build.h>
//#include FT_FREETYPE_H

#include <iostream>

#include <include/glm/glm/glm.hpp>
#include <map>
#include <GLFW/glfw3.h>

struct Character {
	unsigned int	mTextureID;		// ID handle of the glyph texture
	glm::ivec2		mSize;			// size of glyph
	glm::ivec2		mBearing;		// Offset from baseline to left/top of glyph
	unsigned int	mAdvance;		// Offset to advance to next glyph
};

class Text
{
private:
	// functions
	void init();

	// variables
//	FT_Face mFace;
//	FT_Library mFT;

//	std::map<GLchar, Character> mCharacters;

public:
	// constructor/destructor
	Text();
	~Text();

	// functions

	// getters/setters
};
