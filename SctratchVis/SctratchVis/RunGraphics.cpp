#include "Graphics.h"

int main()
{
	Graphics *pGraphics = new Graphics();

	pGraphics->render();

	pGraphics = NULL;
	delete pGraphics;

	return 0;
}