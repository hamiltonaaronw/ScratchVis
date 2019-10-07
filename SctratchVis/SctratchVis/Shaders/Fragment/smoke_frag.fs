#version 410

#define PI		3.1415926535897932384626433832795
#define TAU		(2.0 * PI)

in vec2 oTexCoord;

uniform float uFreq;
uniform float uLastFreq;
uniform float uDeltaFreq;

uniform float uTime;
uniform float uLastFrame;
uniform float uDeltaTime;

uniform vec2 uRes;
uniform float[256] uSpectrum;

out vec4 retColor;

float sinc(float x)
{
	return sin(x) / x;
}

float cosc(float x)
{
	return cos(x) / x;
}

mat2 rot(float a)
{
	mat2 ret = mat2(
		cos(a), -sin(a),
		sin(a), cos(a)
	);
	return ret;
} 

vec3 col(vec2 p)
{
	vec3 c;

	float f = min(uFreq, uLastFreq) + abs(uDeltaFreq / 2.0);
	float ft = smoothstep(uTime, uFreq, f);
	float tf = uTime / f;
	ft *= sinc(cosc(tf));
	f += smoothstep(max(ft, tf), min(tf, ft), f / 100.0) * sinc(uFreq);
	for (float j = 0.0; j < 3.0; j++)
	{
		for (float i = 1.0; i < 12.0; i++)
		{
			p.x += 0.115 / (i + j) * sin(i * 15.87654321 * p.y + uTime +
						cos((f / (7.0 * i * sin(f))) * i + j * f));
			p.y += 0.13 / (i + j) * cos(i * 5.0 * p.x + uTime + 
						sinc((f / (5.3456 * i + cos(f)) / 2.0) * i + j + f));
		}


		p *= length(p * f) / (dot(p, p) / sinc(ft * uFreq)) / f;;
		c[int(j)] = abs(sinc(p.y / p.x) * f - (ft * 0.125));// + f;// - ft;
	}

	c *= (f * 1.05);

	vec3 ret = c;
	return ret;
}

void main()
{
	vec4 ret;
	vec2 uv;

	uv = gl_FragCoord.xy / uRes.x - 0.62;
	ret = vec4(col(uv), 1.0);

	uv = gl_FragCoord.xy / uRes.x - 1.22;
	ret *= vec4(col(uv), 1.0);

	uv = gl_FragCoord.xy / uRes.x - 1.84;
	ret *= vec4(col(uv), 1.0);

	retColor = ret;
}