#include "Text.h"

Text::Text()
{
	init();
}

void Text::init()
{
	/*
	if (FT_Init_FreeType(&mFT))
		std::cout << "ERROR::FREETYPE: Could not init FreeType Library" << std::endl;

	if (FT_New_Face(mFT, "Fonts/Roboto-Black.ttf", 0, &mFace))
		std::cout << "ERROR::FREETYPE: Failed to load font" << std::endl;

	FT_Set_Pixel_Sizes(mFace, 0, 48);
	*/
}

Text::~Text()
{

}