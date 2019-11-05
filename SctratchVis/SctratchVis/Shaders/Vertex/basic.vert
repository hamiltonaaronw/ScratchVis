#version 450 core

layout (location = 0) in vec3 aPos;
layout (location = 1) in vec3 aColor;
layout (location = 2) in vec2 aTexCoord;

out vec3 oColor;
out vec2 oTexCoord;


void main()
{
	gl_Position = vec4(aTexCoord.xy - 0.5, 0.0, 0.5);

	oColor = aColor;
	oTexCoord = aTexCoord;
}