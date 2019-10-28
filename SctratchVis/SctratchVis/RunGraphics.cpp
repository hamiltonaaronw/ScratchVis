#include "Graphics.h"

int main()
{
	gpGraphics = new Graphics();

	gpGraphics->render();

	gpGraphics = NULL;
	delete gpGraphics;
	return 0;
}

